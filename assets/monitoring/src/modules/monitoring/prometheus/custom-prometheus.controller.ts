import { AdminApiKeyGuard } from '@core/guard/apiKey/adminApiKey.guard';
import { isEnvFlagEnabled } from '@core/utils/env/feature-flags.util';
import { Controller, Get, NotFoundException, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';
import { MONITORING_ERROR_MESSAGES } from '@core/messages/monitoring.messages';


/**
 * Protected Prometheus metrics controller.
 * Requires x-admin-api-key header to access /metrics.
 * Path is set dynamically by PrometheusModule.register({ path: '/metrics' }).
 */
@Controller()
export class CustomPrometheusController extends PrometheusController {
    private readonly metricsEnabled: boolean;

    constructor(private readonly configService: ConfigService) {
        super();
        this.metricsEnabled = isEnvFlagEnabled(
            this.configService.get<string>('GRAFANA_ENABLED'),
            true,
        );
    }

    @UseGuards(AdminApiKeyGuard)
    @Get()
    async index(@Res({ passthrough: true }) response: Response): Promise<string> {
        if (!this.metricsEnabled) {
            throw new NotFoundException(MONITORING_ERROR_MESSAGES.METRICS_ENDPOINT_IS_DISABLED);
        }

        return super.index(response);
    }
}
