import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PriceHub (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                transformOptions: { enableImplicitConversion: true },
                whitelist: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Simulated Providers', () => {
        it('GET /providers/a/products', () => {
            return request(app.getHttpServer())
                .get('/providers/a/products')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBeGreaterThan(0);
                    expect(res.body[0]).toHaveProperty('id');
                    expect(res.body[0]).toHaveProperty('price');
                });
        });

        it('GET /providers/b/products', () => {
            return request(app.getHttpServer())
                .get('/providers/b/products')
                .expect(200)
                .expect((res) => {
                    expect(res.body[0]).toHaveProperty('productId');
                    expect(res.body[0]).toHaveProperty('details');
                    expect(res.body[0]).toHaveProperty('pricing');
                });
        });

        it('GET /providers/c/products', () => {
            return request(app.getHttpServer())
                .get('/providers/c/products')
                .expect(200)
                .expect((res) => {
                    expect(res.body[0]).toHaveProperty('sku');
                    expect(res.body[0]).toHaveProperty('cost');
                });
        });
    });

    describe('Products API', () => {
        it('GET /products should return paginated response', () => {
            return request(app.getHttpServer())
                .get('/products')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('data');
                    expect(res.body).toHaveProperty('meta');
                    expect(res.body.meta).toHaveProperty('total');
                    expect(res.body.meta).toHaveProperty('page');
                });
        });

        it('GET /products should accept filter params', () => {
            return request(app.getHttpServer())
                .get('/products?availability=true&minPrice=10&maxPrice=100&provider=provider-a')
                .expect(200);
        });

        it('GET /products/changes should return changes', () => {
            return request(app.getHttpServer())
                .get('/products/changes')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('data');
                    expect(res.body).toHaveProperty('meta');
                });
        });

        it('GET /products/:id should return 404 for invalid id', () => {
            return request(app.getHttpServer())
                .get('/products/00000000-0000-0000-0000-000000000000')
                .expect(404);
        });
    });
});
