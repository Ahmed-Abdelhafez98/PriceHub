import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
    let service: ProductsService;

    const mockPrisma = {
        product: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated products', async () => {
            const mockProducts = [{ id: '1', name: 'Test', price: 10 }];
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            mockPrisma.product.count.mockResolvedValue(1);

            const result = await service.findAll({ page: 1, limit: 20 });

            expect(result.data).toEqual(mockProducts);
            expect(result.meta.total).toBe(1);
            expect(result.meta.page).toBe(1);
            expect(result.meta.totalPages).toBe(1);
        });

        it('should apply filters', async () => {
            mockPrisma.product.findMany.mockResolvedValue([]);
            mockPrisma.product.count.mockResolvedValue(0);

            await service.findAll({
                name: 'test',
                availability: true,
                minPrice: 10,
                maxPrice: 50,
                provider: 'provider-a',
                page: 1,
                limit: 20,
            });

            const queryArg = mockPrisma.product.findMany.mock.calls[0][0];
            expect(queryArg.where.name).toBeDefined();
            expect(queryArg.where.availability).toBe(true);
            expect(queryArg.where.price).toBeDefined();
            expect(queryArg.where.provider).toBe('provider-a');
        });
    });

    describe('findOne', () => {
        it('should return a product with price history', async () => {
            const mockProduct = {
                id: '1',
                name: 'Test',
                priceHistory: [{ price: 10, recordedAt: new Date() }],
            };
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

            const result = await service.findOne('1');
            expect(result).toEqual(mockProduct);
        });

        it('should throw NotFoundException for missing product', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(
                'Product nonexistent not found',
            );
        });
    });
});
