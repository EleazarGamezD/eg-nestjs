import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
// Optional: enable only when Sentry integration is explicitly requested.
// Use the backend's central Sentry initialization before handling requests.
// import * as Sentry from '@sentry/nestjs';
import {
  ErrorLanguage,
  isLocalizedErrorMessage,
  resolveErrorMessage,
  resolveOriginalErrorMessage,
} from '../errors/error-message';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly language: ErrorLanguage = 'en') {}

  /**
   * Normalizes an exception into the localized HTTP contract and logs it.
   *
   * @param exception Exception raised by the request pipeline.
   * @param host Nest execution host used to resolve request and response context.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const executionContext = this.getExecutionContext(host, request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let rawMessage: unknown = {
      en: 'Internal server error',
      es: 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR',
    };
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        rawMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        rawMessage = isLocalizedErrorMessage(exceptionResponse)
          ? exceptionResponse
          : (responseObj.message ?? exception.message);
        details = isLocalizedErrorMessage(exceptionResponse) ? undefined : responseObj;
      } else {
        rawMessage = exception.message;
      }
    } else if (exception instanceof Error) {
      if (exception.message?.includes('Not allowed by CORS')) {
        status = HttpStatus.FORBIDDEN;
        rawMessage = {
          en: 'Origin not allowed by CORS',
          es: 'Origen no permitido por CORS',
          code: 'CORS_ORIGIN_NOT_ALLOWED',
        };
      } else {
        rawMessage = {
          en: exception.message || 'Internal server error',
          es: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR',
        };
        details =
          process.env.NODE_ENV === 'development'
            ? { name: exception.name, stack: exception.stack }
            : undefined;
      }
    }

    const message = this.normalizeMessage(
      resolveErrorMessage(rawMessage, this.language),
      this.language === 'es',
    );
    const originalMessage = this.normalizeMessage(resolveOriginalErrorMessage(rawMessage));
    const cleanDetails = status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? undefined
      : this.cleanDetails(details);
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      originalMessage,
      ...(cleanDetails && { details: cleanDetails }),
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${executionContext} - ${originalMessage}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Optional Sentry integration: uncomment only when requested, together
    // with the import above. Configure the public SDK in the backend first.
    // Replace 'your-backend-name' with this backend's stable service name.
    // if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
    //   Sentry.withScope((scope) => {
    //     scope.setTag('service', 'your-backend-name');
    //     Sentry.captureException(exception, {
    //       mechanism: {
    //         handled: true,
    //         type: 'mercado_meet.global_exception_filter',
    //       },
    //     });
    //   });
    // }

    response.status(status).json(errorResponse);
  }

  /**
   * Removes internal exception fields before returning validation details to clients.
   *
   * @param details Raw exception response details.
   * @returns Client-safe details without framework metadata or stack traces.
   */
  private cleanDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) {
      return undefined;
    }

    const {
      message: _message,
      statusCode: _statusCode,
      error: _error,
      stack: _stack,
      ...rest
    } = details; //eslint-disable-line @typescript-eslint/no-unused-vars
    return Object.keys(rest).length > 0 ? rest : undefined;
  }

  private normalizeMessage(message: string | string[], localize = false): string {
    if (Array.isArray(message)) {
      return message
        .map((item) => localize ? this.localizeValidationMessage(item) : item)
        .join('; ');
    }

    return localize ? this.localizeValidationMessage(message) : message;
  }

  private localizeValidationMessage(message: string): string {
    const forbiddenPropertyMatch = message.match(/^property (.+) should not exist$/);
    if (forbiddenPropertyMatch) {
      return `La propiedad ${forbiddenPropertyMatch[1]} no debe existir.`;
    }

    return message;
  }

  private getExecutionContext(host: ArgumentsHost, request: Request): string {
    const executionHost = host as ArgumentsHost & {
      getClass?: () => { name?: string };
      getHandler?: () => { name?: string };
    };
    const controllerName = executionHost.getClass?.()?.name;
    const handlerName = executionHost.getHandler?.()?.name;

    if (controllerName && handlerName) {
      return `${controllerName}.${handlerName}`;
    }

    return controllerName || handlerName || this.getRequestContext(request);
  }

  private getRequestContext(request: Request): string {
    const moduleName = this.getModuleNameFromPath(request.path || request.url);
    const routePath = request.route?.path;
    const routeTemplate = routePath
      ? `${request.baseUrl || ''}${routePath}`.replace(/\/+/g, '/')
      : request.path || request.url;

    return `module=${moduleName} route=${request.method} ${routeTemplate}`;
  }

  private getModuleNameFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    const moduleSegment = segments[0] === 'api' && segments[1]?.startsWith('v')
      ? segments[2]
      : segments[0];

    return moduleSegment || 'unknown';
  }
}
