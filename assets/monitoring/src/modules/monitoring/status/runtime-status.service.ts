import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';

type RequestSample = {
    ts: number;
    durationMs: number;
    statusCode: number;
    requestBytes: number;
    responseBytes: number;
};

@Injectable()
export class RuntimeStatusService implements OnModuleDestroy {
    private readonly windowMs = 60_000;
    private readonly samples: RequestSample[] = [];
    private readonly startedAt = Date.now();

    private cpuPercent = 0;
    private memoryMb = 0;
    private load1 = 0;
    private eventLoopLagMs = 0;
    private activeRequests = 0;

    private readonly cpuTimer: NodeJS.Timeout;
    private readonly lagTimer: NodeJS.Timeout;
    private prevUsage = process.cpuUsage();
    private prevHr = process.hrtime();
    private expectedLagTick = Date.now();

    constructor() {
        this.refreshSystemMetrics();
        this.cpuTimer = setInterval(() => this.refreshSystemMetrics(), 1000);
        this.cpuTimer.unref();

        this.lagTimer = setInterval(() => this.refreshEventLoopLag(), 500);
        this.lagTimer.unref();
    }

    onModuleDestroy(): void {
        clearInterval(this.cpuTimer);
        clearInterval(this.lagTimer);
    }

    incrementActiveRequests(): void {
        this.activeRequests += 1;
    }

    decrementActiveRequests(): void {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
    }

    recordRequest(statusCode: number, durationMs: number, requestBytes = 0, responseBytes = 0): void {
        this.samples.push({ ts: Date.now(), durationMs, statusCode, requestBytes, responseBytes });
        this.pruneSamples();
    }

    getSnapshot() {
        this.pruneSamples();

        const requestsInWindow = this.samples.length;
        const durations = this.samples.map(item => item.durationMs).sort((a, b) => a - b);
        const avgResponseMs =
            requestsInWindow > 0
                ? this.samples.reduce((acc, item) => acc + item.durationMs, 0) / requestsInWindow
                : 0;
        const p95ResponseMs = this.getPercentile(durations, 95);
        const p99ResponseMs = this.getPercentile(durations, 99);
        const bytesInWindow = this.samples.reduce((acc, item) => acc + item.requestBytes, 0);
        const bytesOutWindow = this.samples.reduce((acc, item) => acc + item.responseBytes, 0);

        const statusCodes = this.samples.reduce(
            (acc, sample) => {
                const bucket = Math.floor(sample.statusCode / 100);
                if (bucket >= 2 && bucket <= 5) {
                    const key = `${bucket}xx` as '2xx' | '3xx' | '4xx' | '5xx';
                    acc[key] += 1;
                }
                return acc;
            },
            { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
        );

        const errorRate4xxPct = requestsInWindow > 0 ? (statusCodes['4xx'] / requestsInWindow) * 100 : 0;
        const errorRate5xxPct = requestsInWindow > 0 ? (statusCodes['5xx'] / requestsInWindow) * 100 : 0;

        return {
            cpuPercent: Number(this.cpuPercent.toFixed(1)),
            memoryMb: Number(this.memoryMb.toFixed(1)),
            load1: Number(this.load1.toFixed(2)),
            responseTimeMs: Number(avgResponseMs.toFixed(2)),
            p95ResponseMs: Number(p95ResponseMs.toFixed(2)),
            p99ResponseMs: Number(p99ResponseMs.toFixed(2)),
            requestsPerSecond: Number((requestsInWindow / (this.windowMs / 1000)).toFixed(2)),
            bytesInPerSecond: Number((bytesInWindow / (this.windowMs / 1000)).toFixed(2)),
            bytesOutPerSecond: Number((bytesOutWindow / (this.windowMs / 1000)).toFixed(2)),
            activeRequests: this.activeRequests,
            eventLoopLagMs: Number(this.eventLoopLagMs.toFixed(2)),
            errorRate4xxPct: Number(errorRate4xxPct.toFixed(2)),
            errorRate5xxPct: Number(errorRate5xxPct.toFixed(2)),
            memory: this.getMemoryDetails(),
            statusCodes,
            uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
            timestamp: Date.now(),
        };
    }

    private pruneSamples(): void {
        const cutoff = Date.now() - this.windowMs;
        while (this.samples.length > 0 && this.samples[0].ts < cutoff) {
            this.samples.shift();
        }
    }

    private refreshSystemMetrics(): void {
        const usageDiff = process.cpuUsage(this.prevUsage);
        const hrDiff = process.hrtime(this.prevHr);

        this.prevUsage = process.cpuUsage();
        this.prevHr = process.hrtime();

        const elapsedMicros = hrDiff[0] * 1_000_000 + hrDiff[1] / 1_000;
        const usedMicros = usageDiff.user + usageDiff.system;

        this.cpuPercent = elapsedMicros > 0 ? (usedMicros / elapsedMicros) * 100 : 0;
        this.memoryMb = process.memoryUsage().rss / 1024 / 1024;
        this.load1 = os.loadavg()[0] || 0;
    }

    private refreshEventLoopLag(): void {
        const now = Date.now();
        if (this.expectedLagTick === 0) {
            this.expectedLagTick = now;
            return;
        }

        const drift = Math.max(0, now - this.expectedLagTick - 500);
        // Smooth spikes with an exponential moving average.
        this.eventLoopLagMs = this.eventLoopLagMs * 0.8 + drift * 0.2;
        this.expectedLagTick = now;
    }

    private getMemoryDetails() {
        const usage = process.memoryUsage();
        return {
            rssMb: Number((usage.rss / 1024 / 1024).toFixed(1)),
            heapUsedMb: Number((usage.heapUsed / 1024 / 1024).toFixed(1)),
            heapTotalMb: Number((usage.heapTotal / 1024 / 1024).toFixed(1)),
            externalMb: Number((usage.external / 1024 / 1024).toFixed(1)),
        };
    }

    private getPercentile(values: number[], percentile: number): number {
        if (values.length === 0) return 0;
        const position = Math.ceil((percentile / 100) * values.length) - 1;
        const index = Math.min(values.length - 1, Math.max(0, position));
        return values[index];
    }
}
