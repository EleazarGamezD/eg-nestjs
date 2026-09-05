import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './health/redis.health.indicator';

/**
 * Health check endpoints for infrastructure monitoring.
 * GET /health        — full check (MongoDB + Redis) — public for DO managed probes
 * GET /health/live   — liveness probe (app is running)
 */
@Controller('health')
export class MonitoringController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly mongoose: MongooseHealthIndicator,
        private readonly redis: RedisHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.mongoose.pingCheck('mongodb'),
            () => this.redis.isHealthy('redis'),
        ]);
    }

    @Get('live')
    liveness() {
        return { status: 'ok' };
    }
}
