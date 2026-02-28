import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { ProviderClientService } from './provider-client.service';
import { NormalizerService } from './normalizer.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AggregationService', () => {
    let service: AggregationService;
    let providerClient: ProviderClientService;
    let normalizer: NormalizerService;
    let prisma: PrismaService;

    const mockPrisma = {
        product: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            updateMany: jest.fn(),
        },
        priceHistory: {
            create: jest.fn(),
        },
    };

    const mockProviderClient = {
        fetchAll: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AggregationService,
                { provide: ProviderClientService, useValue: mockProviderClient },
                NormalizerService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<AggregationService>(AggregationService);
        providerClient = module.get<ProviderClientService>(ProviderClientService);
        normalizer = module.get<NormalizerService>(NormalizerService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process products from all providers', async () => {
        mockProviderClient.fetchAll.mockResolvedValue(
            new Map([
                [
                    'provider-a',
                    [
                        {
                            id: 'a-1',
                            name: 'Test',
                            description: 'desc',
                            price: 10,
                            currency: 'USD',
                            availability: true,
                            lastUpdated: new Date().toISOString(),
                        },
                    ],
                ],
            ]),
        );

        mockPrisma.product.findUnique.mockResolvedValue(null);
        mockPrisma.product.upsert.mockResolvedValue({ id: 'uuid-1' });
        mockPrisma.priceHistory.create.mockResolvedValue({});
        mockPrisma.product.updateMany.mockResolvedValue({ count: 0 });

        await service.aggregate();

        expect(mockProviderClient.fetchAll).toHaveBeenCalledTimes(1);
        expect(mockPrisma.product.upsert).toHaveBeenCalledTimes(1);
        expect(mockPrisma.priceHistory.create).toHaveBeenCalledTimes(1);
    });

    it('should handle provider failures gracefully', async () => {
        mockProviderClient.fetchAll.mockResolvedValue(new Map());
        mockPrisma.product.updateMany.mockResolvedValue({ count: 0 });

        await expect(service.aggregate()).resolves.not.toThrow();
    });
});
