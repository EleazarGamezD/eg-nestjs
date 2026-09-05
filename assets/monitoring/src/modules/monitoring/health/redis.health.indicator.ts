import { REDIS_SESSION_CLIENT } from '@mercado-meet/mm-nestjs-shared';
import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    constructor(@Inject(REDIS_SESSION_CLIENT) private readonly redis: Redis) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            const result = await this.redis.ping();
            const isHealthy = result === 'PONG';
            const indicator = this.getStatus(key, isHealthy);
            if (!isHealthy) {
                throw new HealthCheckError('Redis ping failed', indicator);
            }
            return indicator;
        } catch (error) {
            if (error instanceof HealthCheckError) throw error;
            throw new HealthCheckError(
                'Redis is not available',
                this.getStatus(key, false, { error: (error as Error).message }),
            );
        }
    }
}
