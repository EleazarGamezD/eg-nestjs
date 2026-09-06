# EG NestJS

Personal skill based on the complete **NestJS Best Practices 1.1.0** guide by Kadajett, whose original skill declares the MIT license.

## Complete Content

[AGENTS.md](AGENTS.md) preserves the 40 rules with their explanations and correct/incorrect examples across architecture, dependency injection, errors, security, performance, testing, databases, API design, microservices, and operations.

The only replaced section is **1.2: module organization**, along with its table-of-contents link. It is adapted to DDD/hexagonal architecture with `services/`, `controller/`, `module/`, domain, ports, infrastructure, and the shared EG `core`. The other 39 numbered sections are preserved textually, including their examples.

[SKILL.md](SKILL.md) is the entry point, with the practice index and additional EG conventions. It does not require installing the original skill. `agents/openai.yaml` contains UI metadata.

## Usage And Distribution

Copy this full folder as `.agents/skills/eg-nestjs/` in a project that uses that skills directory. Example invocation:

```text
Use $eg-nestjs to implement this module following the complete guide
and the EG DDD/hexagonal folder structure.
```

The folder is self-contained and ready to publish as a GitHub repository. Preserve attribution to the source material when sharing it.

## Local EG Error Handler

Includes [the error handling guide](references/error-handling.md) and three TypeScript templates extracted from the private `mm-nestjs-shared` 3.5.8 library, so the handler can be implemented inside a backend without installing the private package. It documents the real HTTP contract, message descriptors, validation, logs, and global registration without requiring an external monitoring service. The extracted material belongs to EG's library owner; the MIT attribution of the original NestJS document does not assign a new license to these files.

## EG Swagger

The [Swagger guide](references/swagger.md) preserves the central setup format, controllers, DTOs, examples, security, and JSON download routes. DDD/hexagonal refactors must keep existing documentation and customizations. It includes checks to detect lost operations or schemas.

## Bull Board And Status Monitor

The [monitoring guide](references/monitoring.md) includes complete EG dashboard sources and bootstrap authentication/mounting fragments. It lets an agent replicate the exact UI, metrics logic, route protection, and Bull Board integration when requested, adapting local dependencies without installing the private shared library.

## EG Enums

The [enum convention](references/enums.md) requires fixed business and contract values to be centralized in enums, following project naming and folder conventions. Error message descriptors, environment configuration, Swagger prose, and monitor HTML remain in their proper forms.

## Code Documentation And Contracts

The [code documentation guide](references/code-documentation.md) requires meaningful JSDoc on non-trivial functions and keeps interfaces, type aliases, enums, provider maps, queue names, and event names in dedicated contract files instead of inline service logic.

## Environment Configuration

The [environment configuration guide](references/environment-configuration.md) documents the EG convention for typed grouped config through `IConfiguration`, env enums for module factories, and `getOrThrow` for required values. It avoids raw `configService.get<string>('RAW_ENV')` calls inside service logic while allowing narrow `process.env` usage in platform-agnostic datasource/migration config files.

## EG AsyncAPI

The [AsyncAPI guide](references/asyncapi.md) includes the original setup and DTO reference, the Socket.IO event documentation format, authentication notes, enums, and payload guidance. It preserves `/sockets-docs` and the Swagger link during refactors.

## Domain Messages And Language

[Domain message catalogs](references/messages.md) explain the complete local implementation, with English-only and bilingual examples. New projects default to English; existing EG projects retain Spanish through explicit configuration. Spanish translations are optional for English-speaking users.
