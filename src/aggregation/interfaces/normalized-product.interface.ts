/**
 * Common shape that all provider payloads are normalized into
 * before being persisted.
 */
export interface NormalizedProduct {
    externalId: string;
    provider: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    availability: boolean;
    lastUpdated: Date;
}
