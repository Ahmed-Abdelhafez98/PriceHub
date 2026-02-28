import { Test, TestingModule } from '@nestjs/testing';
import { NormalizerService } from './normalizer.service';

describe('NormalizerService', () => {
    let service: NormalizerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NormalizerService],
        }).compile();

        service = module.get<NormalizerService>(NormalizerService);
    });

    describe('normalizeProviderA', () => {
        it('should map standard flat payload', () => {
            const input = [
                {
                    id: 'a-1',
                    name: 'Test eBook',
                    description: 'A test ebook',
                    price: 29.99,
                    currency: 'USD',
                    availability: true,
                    lastUpdated: '2026-02-28T00:00:00.000Z',
                },
            ];

            const result = service.normalizeProviderA(input);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                externalId: 'a-1',
                provider: 'provider-a',
                name: 'Test eBook',
                description: 'A test ebook',
                price: 29.99,
                currency: 'USD',
                availability: true,
                lastUpdated: new Date('2026-02-28T00:00:00.000Z'),
            });
        });
    });

    describe('normalizeProviderB', () => {
        it('should map nested payload', () => {
            const input = [
                {
                    productId: 'b-1',
                    details: { title: 'React License', desc: 'Annual license' },
                    pricing: { amount: 99.0, unit: 'USD' },
                    inStock: true,
                    updatedAt: '2026-02-28T00:00:00.000Z',
                },
            ];

            const result = service.normalizeProviderB(input);

            expect(result).toHaveLength(1);
            expect(result[0].externalId).toBe('b-1');
            expect(result[0].provider).toBe('provider-b');
            expect(result[0].name).toBe('React License');
            expect(result[0].description).toBe('Annual license');
            expect(result[0].price).toBe(99.0);
            expect(result[0].availability).toBe(true);
        });
    });

    describe('normalizeProviderC', () => {
        it('should map alternative flat payload', () => {
            const input = [
                {
                    sku: 'c-1',
                    productName: 'Python Bundle',
                    info: 'Data science toolkit',
                    cost: 89.99,
                    curr: 'USD',
                    isAvailable: false,
                    timestamp: '2026-02-28T00:00:00.000Z',
                },
            ];

            const result = service.normalizeProviderC(input);

            expect(result).toHaveLength(1);
            expect(result[0].externalId).toBe('c-1');
            expect(result[0].provider).toBe('provider-c');
            expect(result[0].name).toBe('Python Bundle');
            expect(result[0].price).toBe(89.99);
            expect(result[0].availability).toBe(false);
        });
    });
});
