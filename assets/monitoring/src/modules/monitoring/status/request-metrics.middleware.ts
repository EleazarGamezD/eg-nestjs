import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RuntimeStatusService } from './runtime-status.service';

const EXCLUDED_PREFIXES = ['/status', '/api/v2/status', '/metrics', '/admin/queues'];

function parseHeaderBytes(value: string | string[] | number | undefined): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (Array.isArray(value)) {
        const parsed = Number.parseInt(value[0], 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseChunkBytes(chunk: unknown, encoding?: BufferEncoding): number {
    if (Buffer.isBuffer(chunk)) return chunk.length;
    if (typeof chunk === 'string') return Buffer.byteLength(chunk, encoding);
    return 0;
}

@Injectable()
export class RequestMetricsMiddleware implements NestMiddleware {
    constructor(private readonly runtimeStatusService: RuntimeStatusService) { }

    use(req: Request, res: Response, next: NextFunction): void {
        if (EXCLUDED_PREFIXES.some(prefix => req.originalUrl.startsWith(prefix))) {
            next();
            return;
        }

        this.runtimeStatusService.incrementActiveRequests();
        const started = process.hrtime.bigint();

        let streamedRequestBytes = 0;
        const contentLengthRequestBytes = parseHeaderBytes(req.headers['content-length']);
        req.on('data', (chunk: unknown) => {
            streamedRequestBytes += parseChunkBytes(chunk);
        });

        let streamedResponseBytes = 0;
        const originalWrite = res.write.bind(res) as Response['write'];
        const originalEnd = res.end.bind(res) as Response['end'];

        res.write = ((...args: Parameters<Response['write']>) => {
            const chunk = args[0];
            const encoding = (typeof args[1] === 'string' ? args[1] : undefined) as BufferEncoding | undefined;
            streamedResponseBytes += parseChunkBytes(chunk, encoding);
            return originalWrite(...args);
        }) as typeof res.write;

        res.end = ((...args: Parameters<Response['end']>) => {
            const chunk = args[0];
            const encoding = (typeof args[1] === 'string' ? args[1] : undefined) as BufferEncoding | undefined;
            streamedResponseBytes += parseChunkBytes(chunk, encoding);
            return originalEnd(...args);
        }) as typeof res.end;

        let finalized = false;
        const finalize = () => {
            if (finalized) return;
            finalized = true;

            this.runtimeStatusService.decrementActiveRequests();
            const ended = process.hrtime.bigint();
            const durationMs = Number(ended - started) / 1_000_000;
            res.write = originalWrite as typeof res.write;
            res.end = originalEnd as typeof res.end;

            const headerResponseBytes = parseHeaderBytes(res.getHeader('content-length') as string | number | string[] | undefined);
            const requestBytes = streamedRequestBytes > 0 ? streamedRequestBytes : contentLengthRequestBytes;
            const responseBytes = streamedResponseBytes > 0 ? streamedResponseBytes : headerResponseBytes;

            this.runtimeStatusService.recordRequest(res.statusCode, durationMs, requestBytes, responseBytes);
        };

        res.on('finish', finalize);
        res.on('close', finalize);

        next();
    }
}
