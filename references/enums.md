# EG Enums: Avoid Hardcoded Business Strings

## Rule

Fixed values with business or contract meaning must be defined and reused through TypeScript enums. Do not write magic strings directly in comparisons, assignments, repository filters, DTOs, events, job/queue names, or provider calls. This applies even when the value is used once: the criterion is meaning, not repetition count.

Search for an existing enum before creating a new one. Do not replace enums with literal unions (`'active' | 'failed'`) or `as const` objects for new catalogs when following this convention. Do not introduce private dependencies just to reuse an enum; define it locally when the backend does not have it.

For the broader rule that interfaces, type aliases, enums, provider maps, queue names, and event names belong in dedicated contract files instead of service logic, read [code-documentation.md](code-documentation.md). This file focuses on enum value conventions; the contract-file rule applies to all those declaration types.

## Project Format

Reference examples: `SessionLogoutReason`, `DeviceType`, `BrowserName`, and `CarrierGuideJobState` from the EG backend.

- Use `export enum` with a descriptive PascalCase name in English.
- For new enums, use UPPER_SNAKE_CASE members and English member names.
- Use explicit string values and preserve the exact value expected by the contract or database. The project uses values such as `manual`, `Desktop`, and `iPhone`; do not force lowercase or change persisted values to unify style.
- Use kebab-case filenames with the `.enum.ts` suffix, grouped by domain. Document non-obvious meanings with short English comments.
- Shared enums live in `src/core/enums/<domain>/<name>.enum.ts`.
- Feature-only enums live inside the owning domain, for example `src/modules/<domain>/domain/enums/`; transport/provider-specific enums belong to that adapter. Do not make `core` import an enum from a feature module.
- Preserve existing public names such as `CarrierGuideQueueConfig.QueueName` when they are already consumed. The new convention does not authorize indiscriminate public member or file renames.

```typescript
// src/core/enums/session/session-logout-reason.enum.ts
export enum SessionLogoutReason {
  /** User manually logged out */
  MANUAL = 'manual',
  /** Token was revoked */
  TOKEN_REVOKED = 'token_revoked',
}

// Incorrect:
if (session.logoutReason === 'manual') {
  // ...
}

// Correct (import SessionLogoutReason from its real local path):
if (session.logoutReason === SessionLogoutReason.MANUAL) {
  // ...
}
```

Also type properties, parameters, and contracts with the enum when appropriate. In DTOs, use `@IsEnum(SessionLogoutReason)` and `@ApiProperty({ enum: SessionLogoutReason, enumName: 'SessionLogoutReason', example: SessionLogoutReason.MANUAL })`; preserve the rest of the validators and Swagger documentation. Use the same enum in persistence schema constraints when the ORM supports it.

## Other String Categories

- Public errors: use `createErrorMessage({ en, es, code })` descriptors in `core/messages` as described in the error references; do not replace them with enums that lose localization.
- Secrets, URLs, and environment-dependent values: use validated configuration, never enums with credentials or production endpoints.
- Shared technical values that are not catalogs: use descriptive constants in `core/constants` or in the owning module. For catalogs of types, states, reasons, roles, providers, event names, and job/queue names, prefer enums.
- Do not mechanically convert imports, Swagger prose, monitor HTML/CSS, or full diagnostic messages into enum members. Preserve documentation and templates; extract actual catalog values when integrating them, without changing behavior or deleting content.
- Literals are allowed inside enum definitions, descriptors, constants, or documentation examples; avoid repeating them in consuming code.

## Refactoring

Replace strings with equivalent enum members without changing serialized values, defaults, HTTP responses, existing records, or integrations. Do not use casts (`value as SomeEnum`) as a substitute for input validation. Update imports, DTOs, Swagger, and affected usages. Verify types and relevant behavior; avoid tests that only search strings with regex.

This rule specializes the inherited `AGENTS.md` examples and the skill templates: illustrative catalog strings should become local enums when applied. Do not rewrite the 40 original rules or every template just to include the convention.
