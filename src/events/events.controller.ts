import { Controller, Sse, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, interval, switchMap, from } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

interface MessageEvent {
    data: string | object;
}

@ApiTags('Events')
@Controller('events')
export class EventsController {
    private readonly logger = new Logger(EventsController.name);

    constructor(private readonly prisma: PrismaService) { }

    @Sse('products')
    @ApiOperation({ summary: 'SSE stream of product updates (every 5 seconds)' })
    productStream(): Observable<MessageEvent> {
        return interval(5000).pipe(
            switchMap(() =>
                from(
                    this.prisma.product
                        .findMany({
                            orderBy: { updatedAt: 'desc' },
                            take: 50,
                            include: {
                                priceHistory: {
                                    orderBy: { recordedAt: 'desc' },
                                    take: 1,
                                },
                            },
                        })
                        .then((products) => ({
                            data: JSON.stringify(products),
                        })),
                ),
            ),
        );
    }
}
