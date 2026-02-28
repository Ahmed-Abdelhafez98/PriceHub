import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
    let service: ProvidersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ProvidersService],
        }).compile();

        service = module.get<ProvidersService>(ProvidersService);
    });

    it('should return provider A products', () => {
        const products = service.getProviderA();
        expect(products.length).toBeGreaterThan(0);
        expect(products[0]).toHaveProperty('id');
        expect(products[0]).toHaveProperty('name');
        expect(products[0]).toHaveProperty('price');
        expect(products[0]).toHaveProperty('currency');
        expect(products[0]).toHaveProperty('availability');
    });

    it('should return provider B products with nested structure', () => {
        const products = service.getProviderB();
        expect(products.length).toBeGreaterThan(0);
        expect(products[0]).toHaveProperty('productId');
        expect(products[0]).toHaveProperty('details');
        expect(products[0].details).toHaveProperty('title');
        expect(products[0]).toHaveProperty('pricing');
        expect(products[0].pricing).toHaveProperty('amount');
    });

    it('should return provider C products with alternative field names', () => {
        const products = service.getProviderC();
        expect(products.length).toBeGreaterThan(0);
        expect(products[0]).toHaveProperty('sku');
        expect(products[0]).toHaveProperty('productName');
        expect(products[0]).toHaveProperty('cost');
    });

    it('should simulate changes without crashing', () => {
        expect(() => service.simulateChanges()).not.toThrow();
    });
});
