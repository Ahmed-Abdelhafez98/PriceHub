import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';

@ApiTags('Simulated Providers')
@Controller('providers')
export class ProvidersController {
    constructor(private readonly providersService: ProvidersService) { }

    @Get('a/products')
    @ApiOperation({ summary: 'Provider A — standard flat payload' })
    getProviderA() {
        return this.providersService.getProviderA();
    }

    @Get('b/products')
    @ApiOperation({ summary: 'Provider B — nested payload' })
    getProviderB() {
        return this.providersService.getProviderB();
    }

    @Get('c/products')
    @ApiOperation({ summary: 'Provider C — alternative flat payload' })
    getProviderC() {
        return this.providersService.getProviderC();
    }
}
