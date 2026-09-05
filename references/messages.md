# Domain error messages: complete local implementation

## What core/messages contains

A message is a reusable descriptor of an expected error, not an exception, logger or translation service. Domain catalogs collect these descriptors in `src/core/messages/<domain>.messages.ts`. The EG source uses objects such as `CATALOG_ERROR_MESSAGES` for missing categories, invalid catalog fields and similar business failures.

The catalog key identifies the error in code; `en` contains the English message; optional `es` contains its Spanish translation; `code` is a stable English identifier. Define a code for each new descriptor even though the compatibility type permits it to be omitted. Do not store request data, credentials, provider responses or interpolated technical diagnostics in these catalogs.

## Implement the complete chain

1. Copy or integrate [error-message.ts](../assets/error-handling/core/errors/error-message.ts) into `src/core/errors/error-message.ts`.
2. Copy or integrate [custom-exception.ts](../assets/error-handling/core/exceptions/custom-exception.ts) into `src/core/exceptions/custom-exception.ts`.
3. Copy or integrate [global-exception.filter.ts](../assets/error-handling/core/filters/global-exception.filter.ts) into `src/core/filters/global-exception.filter.ts`.
4. Create domain catalogs using local imports as below. Search existing catalogs first to avoid duplicate meanings/codes. Keep domain-specific descriptors in their own file, with genuinely general errors in `common.messages.ts`.
5. Replace inline custom exception messages within the requested scope with catalog references. Preserve the appropriate status: `CustomException` is 400 and `CustomNotFoundException` is 404. Do not convert unknown infrastructure errors into 400 solely to use a catalog.
6. Register the filter once and explicitly select the public language. Update Swagger examples to match it. Use an existing equivalent filter/provider registration when present rather than adding a second one.

No step requires the private EG library. Adjust aliases to the target project; all examples below use local relative imports.

## English-only catalog (default for new projects)

```typescript
// src/core/messages/catalog.messages.ts
import { createErrorMessage } from '../errors/error-message';

export const CATALOG_ERROR_MESSAGES = {
  CATEGORY_NOT_FOUND: createErrorMessage({
    en: 'Category not found',
    code: 'CATEGORY_NOT_FOUND',
  }),
  CATEGORY_ID_IS_REQUIRED: createErrorMessage({
    en: 'Category ID is required',
    code: 'CATEGORY_ID_IS_REQUIRED',
  }),
} as const;
```

## Bilingual catalog (existing EG preference)

```typescript
// src/core/messages/catalog.messages.ts
import { createErrorMessage } from '../errors/error-message';

export const CATALOG_ERROR_MESSAGES = {
  CATEGORY_NOT_FOUND: createErrorMessage({
    en: 'Category not found',
    es: 'No se encontró la categoría',
    code: 'CATEGORY_NOT_FOUND',
  }),
} as const;
```

These are alternative examples for the same file, not two declarations to paste together. Spanish projects should supply translations for their new public errors. An absent Spanish translation falls back to English, never an undefined message.

## Consume a descriptor

```typescript
// Example transport/application boundary utility in src/core/helpers/.
import { CustomNotFoundException } from '../exceptions/custom-exception';
import { CATALOG_ERROR_MESSAGES } from '../messages/catalog.messages';

export function requireCategory<T>(category: T | null | undefined): T {
  if (category == null) {
    throw new CustomNotFoundException(CATALOG_ERROR_MESSAGES.CATEGORY_NOT_FOUND);
  }
  return category;
}
```

The same throw normally lives in the existing application service; do not create a helper just to copy this example. Pure domain entities remain independent of HTTP exceptions and map their failures at the application/transport boundary.

## Select the public language

```typescript
// main.ts, inside bootstrap after creating app:
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

// New English-speaking project:
app.useGlobalFilters(new GlobalExceptionFilter()); // defaults to 'en'

// Alternative for existing EG Spanish-speaking projects:
// app.useGlobalFilters(new GlobalExceptionFilter('es'));
```

Use one registration only. The two supported language values are a type-level configuration choice; keep them centralized in bootstrap or validated configuration, not scattered through services. Do not select language implicitly from the agent's conversation language. Per-request language negotiation is outside this template and should only be added when requested.

## Resolution and HTTP output

`createErrorMessage` returns the descriptor. `CustomNotFoundException` retains it in the internal exception response and records `originalMessage` in English. The global filter selects the configured public language for `message`; logs and `originalMessage` remain English. The descriptor code is not automatically a top-level HTTP field in the current EG contract.

For `CATEGORY_NOT_FOUND`, English mode returns `message: 'Category not found'`; Spanish mode returns `message: 'No se encontró la categoría'`. Both retain `originalMessage: 'Category not found'` and status 404. See [error-handling.md](error-handling.md) for the complete envelope and details behavior.

## Validation when integrating

Check English-only descriptors, bilingual descriptors in each mode, fallback to English when `es` is absent, arrays, unknown failures, and localized validation behavior. Verify 400/404 remain correct and errors still pass through the registered filter. Existing Spanish projects must continue returning Spanish after any integration. Do not change the source backend or private library merely to update this reusable skill.
