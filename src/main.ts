import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const logger = new Logger('Bootstrap');

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            whitelist: true,
        }),
    );

    // Serve static HTML page for real-time dashboard
    app.useStaticAssets(join(__dirname, '..', 'public'));

    // Swagger / OpenAPI
    const config = new DocumentBuilder()
        .setTitle('PriceHub — Product Price Aggregator')
        .setDescription(
            'Aggregates pricing & availability data for digital products from multiple simulated providers.',
        )
        .setVersion('1.0.0')
        .addTag('Products', 'Aggregated product data')
        .addTag('Simulated Providers', 'Mock external provider endpoints')
        .addTag('Events', 'Server-Sent Events for real-time data')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`🚀 PriceHub running on http://localhost:${port}`);
    logger.log(`📚 Swagger docs at  http://localhost:${port}/api`);
}
bootstrap();
