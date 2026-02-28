import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { ProductsModule } from './products/products.module';
import { EventsModule } from './events/events.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
                    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
                },
            ],
        }),
        PrismaModule,
        ProvidersModule,
        AggregationModule,
        ProductsModule,
        EventsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
