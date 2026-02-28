import { Module } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { ProviderClientService } from './provider-client.service';
import { NormalizerService } from './normalizer.service';

@Module({
    providers: [AggregationService, ProviderClientService, NormalizerService],
    exports: [AggregationService],
})
export class AggregationModule { }
