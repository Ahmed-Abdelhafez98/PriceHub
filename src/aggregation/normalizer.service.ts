import { Injectable, Logger } from '@nestjs/common';
import { NormalizedProduct } from './interfaces';
import {
    ProviderAProduct,
    ProviderBProduct,
    ProviderCProduct,
} from '../providers/providers.service';

@Injectable()
export class NormalizerService {
    private readonly logger = new Logger(NormalizerService.name);

    normalizeProviderA(items: ProviderAProduct[]): NormalizedProduct[] {
        return items.map((item) => ({
            externalId: item.id,
            provider: 'provider-a',
            name: item.name,
            description: item.description ?? '',
            price: item.price,
            currency: item.currency,
            availability: item.availability,
            lastUpdated: new Date(item.lastUpdated),
        }));
    }

    normalizeProviderB(items: ProviderBProduct[]): NormalizedProduct[] {
        return items.map((item) => ({
            externalId: item.productId,
            provider: 'provider-b',
            name: item.details.title,
            description: item.details.desc ?? '',
            price: item.pricing.amount,
            currency: item.pricing.unit,
            availability: item.inStock,
            lastUpdated: new Date(item.updatedAt),
        }));
    }

    normalizeProviderC(items: ProviderCProduct[]): NormalizedProduct[] {
        return items.map((item) => ({
            externalId: item.sku,
            provider: 'provider-c',
            name: item.productName,
            description: item.info ?? '',
            price: item.cost,
            currency: item.curr,
            availability: item.isAvailable,
            lastUpdated: new Date(item.timestamp),
        }));
    }
}
