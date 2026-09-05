import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { RedisHealthIndicator } from './health/redis.health.indicator';
import { MonitoringController } from './monitoring.controller';
import { CustomPrometheusController } from './prometheus/custom-prometheus.controller';
import { RequestMetricsMiddleware } from './status/request-metrics.middleware';
import { RuntimeStatusService } from './status/runtime-status.service';
import { StatusMonitorController } from './status/status-monitor.controller';

@Module({
    imports: [
        TerminusModule,
        PrometheusModule.register({
            path: '/metrics',
            controller: CustomPrometheusController,
            defaultMetrics: { enabled: true },
        }),
    ],
    controllers: [MonitoringController, StatusMonitorController],
    providers: [RedisHealthIndicator, RuntimeStatusService],
})
export class MonitoringModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(RequestMetricsMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
