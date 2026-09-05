---
name: eg-nestjs
description: "Guía completa EG para crear, revisar y refactorizar NestJS: conserva las reglas y ejemplos de NestJS Best Practices y adapta la organización de carpetas a DDD/hexagonal con services, controller, module y core compartido."
license: MIT
metadata:
  author: EG
  based-on: NestJS Best Practices by Kadajett 1.1.0
  version: "1.1.0"
---

# EG NestJS

Guía completa basada en NestJS Best Practices 1.1.0. Conserva las 40 reglas, sus explicaciones y ejemplos en 10 categorías. La única sección sustituida del documento original es 1.2, organización de carpetas, adaptada a DDD/hexagonal y las convenciones EG.

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

## EG error handler implemented locally

When implementing, reviewing or changing exception handling, read [references/error-handling.md](references/error-handling.md) and inspect its three linked TypeScript templates. Implement the handler inside the target backend under `src/core/errors`, `src/core/exceptions` and `src/core/filters`; do not install or import the private `@mercado-meet/mm-nestjs-shared` package for this implementation. Reuse existing local equivalents when available. Preserve the documented response, localization, and logging behavior. Keep the optional Sentry import and capture block commented out; activate them only when the user requests Sentry integration, following the reference. This reference specializes section 3 of the full guide without removing it.

## Localized backend errors (existing EG repository convention)

This convention supplements the complete source guide and comes from the EG repository instructions:

- Every new `CustomException` or `CustomNotFoundException` receives a localized descriptor, never a new inline string.
- Reuse descriptors in `src/core/messages/<domain>.messages.ts`; define missing ones with `createErrorMessage({ en, es, code })`.
- Internal names, `en` and `code` are English. Shared exception handling uses `en` for logs and `originalMessage`, and returns `es` to the frontend.
- Keep dynamic or upstream details out of Spanish client messages; log necessary diagnostics separately in English.
- Resolve the helper and exception imports from the target repository rather than introducing a private package automatically.
