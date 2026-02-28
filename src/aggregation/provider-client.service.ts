import { Injectable, Logger } from '@nestjs/common';

interface ProviderConfig {
    name: string;
    url: string;
}

@Injectable()
export class ProviderClientService {
    private readonly logger = new Logger(ProviderClientService.name);

    private readonly maxRetries = parseInt(process.env.MAX_RETRIES ?? '3', 10);
    private readonly retryDelay = parseInt(process.env.RETRY_DELAY_MS ?? '1000', 10);

    private readonly providers: ProviderConfig[] = [
        { name: 'provider-a', url: process.env.PROVIDER_A_URL ?? 'http://localhost:3000/providers/a/products' },
        { name: 'provider-b', url: process.env.PROVIDER_B_URL ?? 'http://localhost:3000/providers/b/products' },
        { name: 'provider-c', url: process.env.PROVIDER_C_URL ?? 'http://localhost:3000/providers/c/products' },
    ];

    /**
     * Fetch all providers concurrently.
     * Returns a map of provider name → raw payload (or null on failure).
     */
    async fetchAll(): Promise<Map<string, any[] | null>> {
        const results = new Map<string, any[] | null>();

        const settled = await Promise.allSettled(
            this.providers.map(async (p) => {
                const data = await this.fetchWithRetry(p);
                return { name: p.name, data };
            }),
        );

        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.set(result.value.name, result.value.data);
            } else {
                this.logger.error(`Provider fetch failed: ${result.reason}`);
            }
        }

        return results;
    }

    private async fetchWithRetry(
        provider: ProviderConfig,
        attempt = 1,
    ): Promise<any[] | null> {
        try {
            const response = await fetch(provider.url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} from ${provider.name}`);
            }
            return (await response.json()) as any[];
        } catch (error) {
            if (attempt >= this.maxRetries) {
                this.logger.error(
                    `Provider ${provider.name} failed after ${this.maxRetries} attempts: ${error.message}`,
                );
                return null;
            }

            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            this.logger.warn(
                `Provider ${provider.name} attempt ${attempt} failed, retrying in ${delay}ms…`,
            );
            await this.sleep(delay);
            return this.fetchWithRetry(provider, attempt + 1);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
