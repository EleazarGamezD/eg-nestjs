# EG Error Handler Inside The Backend

## Origin And Scope

This implementation was extracted from `mm-nestjs-shared` 3.5.8, a private library owned by the author of this skill. The templates adapt the descriptor and filter for configurable public language: English by default and Spanish optional. The custom exceptions preserve their original implementation. The filter template preserves HTTP handling and logs, leaves Sentry integration commented out, and does not require a backend-name constructor parameter. These files are meant to be incorporated into the backend, not installed through the private library. Do not add `@mercado-meet/mm-nestjs-shared` as a dependency or import from it to implement this handler.

This reference specializes section 3 of the complete guide: preserve its propagation and filter practices while using the EG contract for new custom exceptions. Do not replace or duplicate an equivalent global filter that the backend already has.

## Local Files

Copy or integrate according to existing files:

| Skill template | Backend destination |
| --- | --- |
| [error-message.ts](../assets/error-handling/core/errors/error-message.ts) | `src/core/errors/error-message.ts` |
| [custom-exception.ts](../assets/error-handling/core/exceptions/custom-exception.ts) | `src/core/exceptions/custom-exception.ts` |
| [global-exception.filter.ts](../assets/error-handling/core/filters/global-exception.filter.ts) | `src/core/filters/global-exception.filter.ts` |

Define each domain's descriptors in `src/core/messages/<domain>.messages.ts`. Resolve local imports with the backend's real aliases. The templates already use relative imports among the three files.

The original filter uses Express (`Request`, `Response`, `response.status().json()`). For Fastify, adapt request access and response sending through its reply object or `HttpAdapterHost`, while preserving the contract; do not copy Express signatures literally.

## Catalogs And Public Language

Read [messages.md](messages.md) to implement domain catalogs and the complete local chain from scratch. `en` is required; `es` is optional. The new template uses English by default; register `new GlobalExceptionFilter('es')` only to preserve existing EG Spanish behavior. Spanish examples below correspond to that explicit mode. In English mode, `message` resolves in English and the Spanish validation translation is not applied. Logs and `originalMessage` always keep English.

## Descriptors And Exceptions

```typescript
// src/core/messages/orders.messages.ts
import { createErrorMessage } from '../errors/error-message';

export const ORDER_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: createErrorMessage({
    en: 'Order not found',
    es: 'Localized Spanish message when this project explicitly uses Spanish',
    code: 'ORDER_NOT_FOUND',
  }),
} as const;
```

In an application service, import the local `CustomNotFoundException` and descriptor, then throw `new CustomNotFoundException(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND)`.

- `CustomException` extends `BadRequestException`: HTTP 400.
- `CustomNotFoundException` extends `NotFoundException`: HTTP 404.
- Both build `{ status, message, originalMessage }`; the descriptor remains in `message` until the filter resolves it.
- `ErrorMessageInput` accepts strings, descriptors, and homogeneous arrays of either for compatibility. For new custom exceptions, always use descriptors.
- `createErrorMessage` returns the descriptor it receives; it does not register translations or validate at runtime. `code` is optional in the original type, but define it on every new descriptor.
- `resolveErrorMessage` selects `en` by default; it accepts explicit `es` and falls back to English if the translation is missing. `resolveOriginalErrorMessage` selects `en`. Both resolve arrays recursively. Legacy strings are preserved.
- Pure domain entities and values do not import HTTP exceptions; translate their failures in application services or at the transport boundary.

## HTTP Contract, With Spanish Mode Enabled

The filter returns:

```json
{
  "statusCode": 404,
  "timestamp": "2026-09-05T12:00:00.000Z",
  "path": "/orders/123",
  "method": "GET",
  "message": "Localized Spanish message when this project explicitly uses Spanish",
  "originalMessage": "Order not found",
  "details": {
    "status": 404,
    "originalMessage": "Order not found"
  }
}
```

`details` is conditional. In these custom exceptions, it preserves `status` and `originalMessage` because the filter only removes `message`, `statusCode`, `error`, and `stack`. The descriptor `code` is not published as a top-level field in this implementation. Do not invent that field or silently change the contract.

| Input | Original behavior |
| --- | --- |
| `HttpException` | Preserves `getStatus()`; extracts a direct descriptor, `response.message`, or a string |
| Message array | Resolves elements and joins them with `; `, both for public message and original message |
| `property X should not exist` | In Spanish mode, translates only public `message` to `La propiedad X no debe existir.` |
| `Error` whose message contains `Not allowed by CORS` | HTTP 403 with CORS message in the selected public language and English original |
| Other `Error` | HTTP 500, generic public message and English original from `exception.message` |
| Unknown value | HTTP 500 with generic public/original messages |
| Any status >= 500 | Omits `details` |

The filter does not automatically translate every class-validator message. It only translates the pattern above. For new validations that require Spanish, configure proper messages or extend translation deliberately with tests.

**Compatibility detail:** `originalMessage` is sent to the client, even for 500 responses, and may contain the original technical diagnostic. `cleanDetails` removes four keys only; it does not perform recursive cleanup or an allowlist. Do not include secrets or private data in HTTP exceptions. If a task asks to hide production diagnostics, return a generic original for 500s and keep the diagnostic in logs as an explicit contract change; the attached templates preserve the original behavior.

## Global Registration

Register once, after creating the application:

```typescript
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

// Inside bootstrap, after app creation:
app.useGlobalFilters(new GlobalExceptionFilter()); // English by default
// Existing EG Spanish projects: new GlobalExceptionFilter('es')
```

If the project registers filters through `APP_FILTER`, integrate this filter through a provider instead of also registering it with `useGlobalFilters`. The handler uses NestJS `Logger` and does not require an external monitoring service.

All failures are logged with `Logger.error`, including method, URL, status, context, and original message; when an `Error` exists, its stack is included. Context attempts `Controller.handler` and falls back to a module inferred from the URL and route template. The inference recognizes `/api/v*/<module>`; adapt different prefixes when relevant.

The filter is designed for HTTP. RPC, queues, and WebSockets need their own error adapter; do not call `switchToHttp()` in those contexts.

## Integration Verification

Test the observable contract with the backend's runner: localized 400/404, legacy messages, arrays, forbidden-property translation when Spanish mode is enabled, CORS 403, unknown 500, no `details` for 500, field cleanup for 4xx, and log context. Also verify global registration with an HTTP request and local imports through types/build.

## Sentry: Commented Reference For Activation On Request

The template contains the original import and capture block as comments, with no active dependency. Do not install or activate Sentry by default. If the user requests it:

1. Reuse the backend's central integration or configure the public `@sentry/nestjs` SDK according to the version used by the project, with credentials from environment configuration.
2. Uncomment the import and `Sentry.withScope` block in the template. Replace `your-backend-name` with the stable service name or equivalent configuration.
3. Keep capture only for statuses >= 500, preserve the `service` tag and displayed mechanism, and keep the existing HTTP response and logger.
4. Verify with a no-network double that a 500 is captured with the correct tag and a 400/404 is not captured. Review any existing integration to avoid reporting the same exception twice.

This integration uses the public SDK, never EG's private library.
