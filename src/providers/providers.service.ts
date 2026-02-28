import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

// ---------- Provider A payload (standard flat) ----------
export interface ProviderAProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    availability: boolean;
    lastUpdated: string;
}

// ---------- Provider B payload (nested) ----------
export interface ProviderBProduct {
    productId: string;
    details: { title: string; desc: string };
    pricing: { amount: number; unit: string };
    inStock: boolean;
    updatedAt: string;
}

// ---------- Provider C payload (flat alternative) ----------
export interface ProviderCProduct {
    sku: string;
    productName: string;
    info: string;
    cost: number;
    curr: string;
    isAvailable: boolean;
    timestamp: string;
}

// --- seed catalogues ---
const SEED_A: ProviderAProduct[] = [
    { id: 'a-1', name: 'TypeScript Mastery eBook', description: 'Comprehensive guide to TypeScript', price: 29.99, currency: 'USD', availability: true, lastUpdated: new Date().toISOString() },
    { id: 'a-2', name: 'Node.js Design Patterns', description: 'Advanced patterns for Node.js', price: 34.99, currency: 'USD', availability: true, lastUpdated: new Date().toISOString() },
    { id: 'a-3', name: 'Docker Essentials Course', description: 'Learn Docker from scratch', price: 49.99, currency: 'USD', availability: true, lastUpdated: new Date().toISOString() },
    { id: 'a-4', name: 'PostgreSQL Bootcamp', description: 'Master relational databases', price: 39.99, currency: 'USD', availability: false, lastUpdated: new Date().toISOString() },
    { id: 'a-5', name: 'CI/CD Pipeline Guide', description: 'Automate your deployments', price: 19.99, currency: 'USD', availability: true, lastUpdated: new Date().toISOString() },
];

const SEED_B: ProviderBProduct[] = [
    { productId: 'b-1', details: { title: 'React Pro License', desc: 'Annual license for React Pro IDE' }, pricing: { amount: 99.00, unit: 'USD' }, inStock: true, updatedAt: new Date().toISOString() },
    { productId: 'b-2', details: { title: 'AWS Certification Pack', desc: 'Study materials + exam voucher' }, pricing: { amount: 149.99, unit: 'USD' }, inStock: true, updatedAt: new Date().toISOString() },
    { productId: 'b-3', details: { title: 'Kubernetes Masterclass', desc: 'Deep-dive into K8s' }, pricing: { amount: 79.99, unit: 'USD' }, inStock: false, updatedAt: new Date().toISOString() },
    { productId: 'b-4', details: { title: 'GraphQL Complete Course', desc: 'Build APIs with GraphQL' }, pricing: { amount: 54.99, unit: 'USD' }, inStock: true, updatedAt: new Date().toISOString() },
    { productId: 'b-5', details: { title: 'Microservices Architecture', desc: 'Design scalable systems' }, pricing: { amount: 64.99, unit: 'USD' }, inStock: true, updatedAt: new Date().toISOString() },
];

const SEED_C: ProviderCProduct[] = [
    { sku: 'c-1', productName: 'Python Data Science Bundle', info: 'Jupyter + pandas + ML toolkit', cost: 89.99, curr: 'USD', isAvailable: true, timestamp: new Date().toISOString() },
    { sku: 'c-2', productName: 'Linux Admin Handbook', info: 'Digital copy — 4th edition', cost: 24.99, curr: 'USD', isAvailable: true, timestamp: new Date().toISOString() },
    { sku: 'c-3', productName: 'Figma Team License', info: '1-year team subscription', cost: 144.00, curr: 'USD', isAvailable: true, timestamp: new Date().toISOString() },
    { sku: 'c-4', productName: 'Rust Programming eBook', info: 'Systems programming with Rust', cost: 31.99, curr: 'USD', isAvailable: false, timestamp: new Date().toISOString() },
    { sku: 'c-5', productName: 'DevOps Toolkit', info: 'Terraform + Ansible bundle', cost: 109.99, curr: 'USD', isAvailable: true, timestamp: new Date().toISOString() },
];

@Injectable()
export class ProvidersService {
    private readonly logger = new Logger(ProvidersService.name);

    private catalogueA: ProviderAProduct[] = JSON.parse(JSON.stringify(SEED_A));
    private catalogueB: ProviderBProduct[] = JSON.parse(JSON.stringify(SEED_B));
    private catalogueC: ProviderCProduct[] = JSON.parse(JSON.stringify(SEED_C));

    getProviderA(): ProviderAProduct[] {
        return this.catalogueA;
    }

    getProviderB(): ProviderBProduct[] {
        return this.catalogueB;
    }

    getProviderC(): ProviderCProduct[] {
        return this.catalogueC;
    }

    /**
     * Randomly nudge prices and toggle availability every 5 seconds
     * to simulate real-world data changes.
     */
    @Interval(5000)
    simulateChanges(): void {
        this.nudgeCatalogue(this.catalogueA, 'A');
        this.nudgeCatalogueB();
        this.nudgeCatalogueC();
    }

    // --- helpers ---

    private nudgeCatalogue(cat: ProviderAProduct[], label: string): void {
        const idx = Math.floor(Math.random() * cat.length);
        const item = cat[idx];
        const delta = (Math.random() - 0.5) * 10; // ±5
        item.price = Math.max(1, +(item.price + delta).toFixed(2));
        if (Math.random() < 0.2) item.availability = !item.availability;
        item.lastUpdated = new Date().toISOString();
        this.logger.debug(`Provider ${label}: ${item.name} → $${item.price}`);
    }

    private nudgeCatalogueB(): void {
        const idx = Math.floor(Math.random() * this.catalogueB.length);
        const item = this.catalogueB[idx];
        const delta = (Math.random() - 0.5) * 10;
        item.pricing.amount = Math.max(1, +(item.pricing.amount + delta).toFixed(2));
        if (Math.random() < 0.2) item.inStock = !item.inStock;
        item.updatedAt = new Date().toISOString();
        this.logger.debug(`Provider B: ${item.details.title} → $${item.pricing.amount}`);
    }

    private nudgeCatalogueC(): void {
        const idx = Math.floor(Math.random() * this.catalogueC.length);
        const item = this.catalogueC[idx];
        const delta = (Math.random() - 0.5) * 10;
        item.cost = Math.max(1, +(item.cost + delta).toFixed(2));
        if (Math.random() < 0.2) item.isAvailable = !item.isAvailable;
        item.timestamp = new Date().toISOString();
        this.logger.debug(`Provider C: ${item.productName} → $${item.cost}`);
    }
}
