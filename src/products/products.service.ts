import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetProductsQueryDto, GetChangesQueryDto } from './dto';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Paginated, filterable list of aggregated products.
     */
    async findAll(query: GetProductsQueryDto) {
        const { name, availability, minPrice, maxPrice, provider } = query;
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const where: Prisma.ProductWhereInput = {};

        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }
        if (availability !== undefined) {
            where.availability = availability;
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
            if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
        }
        if (provider) {
            where.provider = provider;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Single product with full price history.
     */
    async findOne(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                priceHistory: {
                    orderBy: { recordedAt: 'desc' },
                },
            },
        });

        if (!product) {
            throw new NotFoundException(`Product ${id} not found`);
        }

        return product;
    }

    /**
     * Products whose price or availability changed within a timeframe.
     */
    async findChanges(query: GetChangesQueryDto) {
        const since = query.since
            ? new Date(query.since)
            : new Date(Date.now() - 3600_000); // default: last hour

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        // Find products that have price-history records after `since`
        const where: Prisma.ProductWhereInput = {
            priceHistory: {
                some: {
                    recordedAt: { gte: since },
                },
            },
        };

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    priceHistory: {
                        where: { recordedAt: { gte: since } },
                        orderBy: { recordedAt: 'desc' },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                since: since.toISOString(),
            },
        };
    }
}
