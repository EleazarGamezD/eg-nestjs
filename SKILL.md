---
name: eg-nestjs
description: "Complete EG guide for creating, reviewing, and refactoring NestJS projects: preserves the NestJS Best Practices rules and examples while adapting module organization to DDD/hexagonal architecture with services, controller, module, and shared core."
license: MIT
metadata:
  author: EG
  based-on: NestJS Best Practices by Kadajett 1.1.0
  version: "1.1.0"
---

# EG NestJS

Complete guide based on NestJS Best Practices 1.1.0. It preserves the 40 rules, explanations, and examples across 10 categories. The only replaced section from the original document is 1.2, folder organization, adapted to DDD/hexagonal architecture and EG conventions.

## When to Apply

Reference these guidelines when:

- Writing new NestJS modules, controllers, or services
- Implementing authentication and authorization
- Reviewing code for architecture and security issues
- Refactoring existing NestJS codebases
- Optimizing performance or database queries
- Building microservices architectures

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture | CRITICAL | `arch-` |
| 2 | Dependency Injection | CRITICAL | `di-` |
| 3 | Error Handling | HIGH | `error-` |
| 4 | Security | HIGH | `security-` |
| 5 | Performance | HIGH | `perf-` |
| 6 | Testing | MEDIUM-HIGH | `test-` |
| 7 | Database & ORM | MEDIUM-HIGH | `db-` |
| 8 | API Design | MEDIUM | `api-` |
| 9 | Microservices | MEDIUM | `micro-` |
| 10 | DevOps & Deployment | LOW-MEDIUM | `devops-` |

## Quick Reference

### 1. Architecture (CRITICAL)

- `arch-avoid-circular-deps` - Avoid circular module dependencies
- `arch-feature-modules` - Organize by domain with EG DDD/hexagonal folders: services/, controller/, module/ and shared core/
- `arch-module-sharing` - Proper module exports/imports, avoid duplicate providers
- `arch-single-responsibility` - Focused services over "god services"
- `arch-use-repository-pattern` - Abstract database logic for testability
- `arch-use-events` - Event-driven architecture for decoupling

### 2. Dependency Injection (CRITICAL)

- `di-avoid-service-locator` - Avoid service locator anti-pattern
- `di-interface-segregation` - Interface Segregation Principle (ISP)
- `di-liskov-substitution` - Liskov Substitution Principle (LSP)
- `di-prefer-constructor-injection` - Constructor over property injection
- `di-scope-awareness` - Understand singleton/request/transient scopes
- `di-use-interfaces-tokens` - Use injection tokens for interfaces

### 3. Error Handling (HIGH)

- `error-use-exception-filters` - Centralized exception handling
- `error-throw-http-exceptions` - Use NestJS HTTP exceptions
- `error-handle-async-errors` - Handle async errors properly

### 4. Security (HIGH)

- `security-auth-jwt` - Secure JWT authentication
- `security-validate-all-input` - Validate with class-validator
- `security-use-guards` - Authentication and authorization guards
- `security-sanitize-output` - Prevent XSS attacks
- `security-rate-limiting` - Implement rate limiting

### 5. Performance (HIGH)

- `perf-async-hooks` - Proper async lifecycle hooks
- `perf-use-caching` - Implement caching strategies
- `perf-optimize-database` - Optimize database queries
- `perf-lazy-loading` - Lazy load modules for faster startup

### 6. Testing (MEDIUM-HIGH)

- `test-use-testing-module` - Use NestJS testing utilities
- `test-e2e-supertest` - E2E testing with Supertest
- `test-mock-external-services` - Mock external dependencies

### 7. Database & ORM (MEDIUM-HIGH)

- `db-use-transactions` - Transaction management
- `db-avoid-n-plus-one` - Avoid N+1 query problems
- `db-use-migrations` - Use migrations for schema changes

### 8. API Design (MEDIUM)

- `api-use-dto-serialization` - DTO and response serialization
- `api-use-interceptors` - Cross-cutting concerns
- `api-versioning` - API versioning strategies
- `api-use-pipes` - Input transformation with pipes

### 9. Microservices (MEDIUM)

- `micro-use-patterns` - Message and event patterns
- `micro-use-health-checks` - Health checks for orchestration
- `micro-use-queues` - Background job processing

### 10. DevOps & Deployment (LOW-MEDIUM)

- `devops-use-config-module` - Environment configuration
- `devops-use-logging` - Structured logging
- `devops-graceful-shutdown` - Zero-downtime deployments

## How to Use

Read [AGENTS.md](AGENTS.md), the complete authoritative guide bundled with this skill. For implementation or review, read the full sections relevant to the task, including their incorrect/correct examples; do not treat this quick reference as a replacement. For a comprehensive review, cover all 10 categories.

The table of contents in `AGENTS.md` routes to all 40 rules. Section 1.2 defines EG folder organization and takes precedence over abbreviated example paths elsewhere. All other numbered sections retain the original text and examples. Preserve their guidance on dependency injection, exceptions, security, performance, testing, databases, APIs, messaging and operations.

Follow repository instructions and installed dependency versions when applying examples. Inspect existing `core` responsibilities and module conventions before choosing file locations. Keep NestJS application-service patterns from the source; do not impose an additional pure-service/factory-only architecture.

## Environment configuration

When creating, changing or reviewing environment access, follow [references/environment-configuration.md](references/environment-configuration.md). Prefer typed grouped config in `src/core/config/configuration.ts` through `IConfiguration` keys such as `wompiKeys`, `firebaseConfig`, `redisKeys` or provider-specific groups. In module factories, load grouped config once into a named constant, then build options with `config.port`, `config.ssl`, and similar properties instead of repeating `configService.get(...)` for every field. Where a module factory naturally needs raw env keys, use env enums such as `MailEnv`, not inline strings. Avoid `this.configService.get<string>('RAW_ENV_NAME')` and `process.env` inside services/business logic; use grouped typed config or enum-backed access instead. Use `getOrThrow` for required configuration and explicit optional handling for integrations that may be disabled. Direct `process.env` is allowed only in narrow platform-agnostic configuration files that must also run outside NestJS, such as TypeORM datasource/migration config, standalone CLI config, early pre-Nest bootstrap, and the central configuration mapper.

## Code documentation and contract files

When writing or refactoring functions, interfaces, types, enums, provider maps, queue names or event names, follow [references/code-documentation.md](references/code-documentation.md). New or meaningfully changed functions that contain business, application, integration, validation, authorization, queue, WebSocket, monitoring or reusable helper logic should have JSDoc with a useful description, relevant `@param` entries, `@returns` for non-void functions, realistic `@example` when reusable or non-trivial, and `@throws` when intentional errors are part of the contract. Keep services/controllers focused on behavior: interfaces, type aliases, enums and provider maps belong in their own files under `core` or the owning feature domain, not inline inside service logic.

## EG enums: no hardcoded business strings

When writing or refactoring backend code, follow [references/enums.md](references/enums.md). Fixed business/contract values (statuses, types, roles, reasons, providers, queue/job/event names) must use existing or locally defined TypeScript enums, not inline magic strings, even for a single use. Shared enums belong in `src/core/enums/<domain>/`; feature-only enums remain in their owning domain. Use English PascalCase enum names, UPPER_SNAKE_CASE members for new enums, and explicit string values that preserve the real contract. Keep localized error descriptors, environment configuration and explanatory Swagger/monitor text in their proper forms; do not mechanically turn every string into an enum. This convention also applies when adapting the full guide's examples and bundled templates.

## Bull Board and exact EG Status Monitor replication

For queue administration or requests to replicate/add the EG status monitor, read [references/monitoring.md](references/monitoring.md) and its linked complete source templates. Use Bull Board when queues are in scope; extend an existing board when adding queues. Do not introduce queues just to provide a dashboard. When asked for the status monitor, reproduce the supplied custom UI, charts, metrics, login and polling instead of designing a replacement or using nest-status-monitor. Treat `assets/monitoring/status-monitor.html` and the inline HTML in `StatusMonitorController.page()` as the exact visual source for the dashboard; preserve the HTML/CSS/JS structure, ids, classes, Chart.js setup and login flow while adapting only real project values such as names and routes. Include bootstrap authentication, middleware registration, Bull Board mounting, global-prefix exclusions and route wiring from the MM backend entrypoint; this may live in `main.ts` or another bootstrap file in the target project. The controller alone does not secure metrics or feed request data. Adapt only project identity, paths, local providers and relevant infrastructure. Preserve existing Swagger and add links for the implemented tools. Do not require the private shared library or Sentry.

## AsyncAPI for WebSockets / Socket.IO

When creating, changing or documenting WebSocket gateways, read [references/asyncapi.md](references/asyncapi.md) and its source templates. Preserve the central async setup, `/sockets-docs`, Swagger links, gateway decorators and payload metadata during refactors. Follow the EG convention of AsyncApiSub for incoming events and AsyncApiPub for outgoing events, sharing enum names with runtime handlers/emitters. Document actual namespaces, handshake authentication, reconnection flows and wire payloads. Do not remove AsyncAPI to achieve domain purity or replace it with HTTP-only Swagger. Adapt project identity and servers without requiring the private shared library.

## Swagger / OpenAPI preservation and EG format

Swagger is a required part of the HTTP API deliverable. Before changing controllers, transport DTOs, bootstrap, module layout or API documentation, read [references/swagger.md](references/swagger.md). Preserve existing setup, decorators, descriptions, examples, models, security schemes, UI customizations and JSON/download routes. DDD/hexagonal refactoring must relocate transport metadata with its controllers/DTOs, never remove it to make the domain pure. Remove documentation only when the requested scope explicitly removes its functionality or Swagger itself. Extend the existing documentation in the EG format and verify that affected OpenAPI contracts remain documented.

## EG error handler implemented locally

When implementing, reviewing or changing exception handling, read [references/error-handling.md](references/error-handling.md) and inspect its three linked TypeScript templates. Implement the handler inside the target backend under `src/core/errors`, `src/core/exceptions` and `src/core/filters`; do not install or import the private `@mercado-meet/mm-nestjs-shared` package for this implementation. Reuse existing local equivalents when available. Preserve the documented response, localization, and logging behavior. Keep the optional Sentry import and capture block commented out; activate them only when the user requests Sentry integration, following the reference. This reference specializes section 3 of the full guide without removing it.

## Domain message catalogs and optional localization

For requests to implement the EG messages/error system in another backend, read [references/messages.md](references/messages.md) and [references/error-handling.md](references/error-handling.md). Implement the complete local chain: domain catalogs in `src/core/messages/<domain>.messages.ts`, descriptor helpers, custom exceptions and the global filter registration. A filter alone is not a complete implementation.

- Every new `CustomException` or `CustomNotFoundException` receives a reusable descriptor, never a new inline string or upstream error message.
- Export domain catalogs such as `CATALOG_ERROR_MESSAGES`, with English UPPER_SNAKE_CASE keys, using `createErrorMessage({ en, code })`. Add `es` only when Spanish is needed.
- English is the default public language for new projects without a language preference. Internal names, codes, logs and `originalMessage` remain English. Spanish is optional; do not require English-only users to author Spanish translations.
- Preserve existing project language requirements. For EG projects currently returning Spanish, keep `en` and `es` and select Spanish explicitly; do not migrate their API language just because the reusable template defaults to English.
- Keep dynamic/upstream diagnostics out of public messages; log them separately. Reuse existing descriptors before adding another.
- Implement locally without installing the private shared package. Keep Sentry commented unless requested.
