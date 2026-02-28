import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderClientService } from './provider-client.service';
import { NormalizerService } from './normalizer.service';
import { NormalizedProduct } from './interfaces';

@Injectable()
export class AggregationService {
    private readonly logger = new Logger(AggregationService.name);
    private readonly fetchInterval = parseInt(
        process.env.FETCH_INTERVAL_MS ?? '30000',
        10,
    );
    private readonly staleThreshold = parseInt(
        process.env.STALE_THRESHOLD_MS ?? '120000',
        10,
    );

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerClient: ProviderClientService,
        private readonly normalizer: NormalizerService,
    ) { }

    /**
     * Main aggregation loop — runs periodically.
     */
    @Interval(parseInt(process.env.FETCH_INTERVAL_MS ?? '30000', 10))
    async aggregate(): Promise<void> {
        this.logger.log('Starting aggregation cycle…');

        try {
            const rawData = await this.providerClient.fetchAll();
            const allProducts: NormalizedProduct[] = [];

            for (const [provider, items] of rawData.entries()) {
                if (!items) continue;

                try {
                    let normalized: NormalizedProduct[];
                    switch (provider) {
                        case 'provider-a':
                            normalized = this.normalizer.normalizeProviderA(items);
                            break;
                        case 'provider-b':
                            normalized = this.normalizer.normalizeProviderB(items);
                            break;
                        case 'provider-c':
                            normalized = this.normalizer.normalizeProviderC(items);
                            break;
                        default:
                            this.logger.warn(`Unknown provider: ${provider}`);
                            continue;
                    }
                    allProducts.push(...normalized);
                } catch (err) {
                    this.logger.error(`Normalization error for ${provider}: ${err.message}`);
                }
            }

            await this.upsertProducts(allProducts);
            await this.markStaleProducts();

            this.logger.log(`Aggregation complete — ${allProducts.length} products processed`);
        } catch (err) {
            this.logger.error(`Aggregation cycle failed: ${err.message}`);
        }
    }

    /**
     * Upsert each product and create a PriceHistory record when the price or availability changes.
     */
    private async upsertProducts(products: NormalizedProduct[]): Promise<void> {
        for (const p of products) {
            const existing = await this.prisma.product.findUnique({
                where: {
                    externalId_provider: {
                        externalId: p.externalId,
                        provider: p.provider,
                    },
                },
            });

            const priceDecimal = new Prisma.Decimal(p.price);
            const priceChanged = existing && !existing.price.equals(priceDecimal);
            const availChanged = existing && existing.availability !== p.availability;

            const product = await this.prisma.product.upsert({
                where: {
                    externalId_provider: {
                        externalId: p.externalId,
                        provider: p.provider,
                    },
                },
                create: {
                    externalId: p.externalId,
                    provider: p.provider,
                    name: p.name,
                    description: p.description,
                    price: priceDecimal,
                    currency: p.currency,
                    availability: p.availability,
                    lastUpdated: p.lastUpdated,
                    lastFetchedAt: new Date(),
                    isStale: false,
                },
                update: {
                    name: p.name,
                    description: p.description,
                    price: priceDecimal,
                    currency: p.currency,
                    availability: p.availability,
                    lastUpdated: p.lastUpdated,
                    lastFetchedAt: new Date(),
                    isStale: false,
                },
            });

            // Record price / availability change
            if (!existing || priceChanged || availChanged) {
                await this.prisma.priceHistory.create({
                    data: {
                        productId: product.id,
                        price: priceDecimal,
                        currency: p.currency,
                        availability: p.availability,
                    },
                });
            }
        }
    }

    /**
     * Mark products as stale when they haven't been fetched within the threshold.
     */
    private async markStaleProducts(): Promise<void> {
        const threshold = new Date(Date.now() - this.staleThreshold);

        const { count } = await this.prisma.product.updateMany({
            where: {
                lastFetchedAt: { lt: threshold },
                isStale: false,
            },
            data: { isStale: true },
        });

        if (count > 0) {
            this.logger.warn(`Marked ${count} product(s) as stale`);
        }
    }
}
