# EG Swagger / OpenAPI

## Preservation Rule

Swagger is part of the API deliverable. When applying this skill, refactoring to DDD/hexagonal architecture, moving folders, separating DTOs, or cleaning imports, preserve the setup and all existing documentation. Do not remove Swagger, its dependencies, bootstrap registration, contracts, decorators, examples, security schemes, or documentation routes because they seem outside the domain. Domain purity is achieved by keeping transport metadata in controllers and transport DTOs.

Only remove an operation or documentation when the task authorizes removing the corresponding functionality or explicitly asks to remove Swagger. If a DTO or controller is replaced, move its metadata and references before deleting the old file. Fix stale documentation while preserving useful detail and explaining contract changes; do not replace complete descriptions with minimal or generic documentation.

This reference complements the 40 rules in `AGENTS.md` and specializes their application to HTTP documentation.

## Format Observed In The EG Backend

- Central setup in `src/core/config/swagger/config/swagger.ts`, exporting `setupSwagger(app)` and invoking it from bootstrap.
- Explicit contract class registration in `src/core/config/swagger/contracts/contracs.ts`, passed as `extraModels: contracts` to `SwaggerModule.createDocument`. Preserve the existing `contracs.ts` name when modifying that project; new projects can use `contracts.ts` without creating both.
- `DocumentBuilder` defines title, extended Markdown description, version, environment-specific server, contact, and links to related documentation.
- The description includes an OpenAPI JSON download importable into Postman, AsyncAPI documentation, Markdown docs, and a monitoring tools table with link and authentication details. Keep existing links; in other projects, include only tools that actually exist.
- The reference project uses `BACKEND_PUBLIC_URL`, removes trailing slashes, and falls back to `http://localhost:3000/api/v2`. It labels the server as Production, Development, or Local. Adapt URL, port, and prefix to the target project without imposing `/api/v2` or the Mercado Meet brand.
- In the reference project, Swagger UI lives at `/`, JSON at `/swagger-json`, download at `/swagger-json-download`, and the button script at `/swagger-download.js`. Preserve the routes each project uses; do not automatically move Swagger to `/api` or `/docs`.
- The download serves JSON with `Content-Type: application/json; charset=utf-8` and `Content-Disposition: attachment`; the filename belongs to each backend. The `Download JSON` button is added to the top bar without duplication.
- UI options: `persistAuthorization: true`, `docExpansion: 'none'`, `filter: true`; `jsonDocumentUrl` points to the JSON route and `customJs` includes the download script. Preserve additional customizations and existing access restrictions.

Do not copy Mercado Meet contacts, deployment domains, brands, or private integrations into unrelated projects. Reproduce the organization and format with the target project's real data.

## Controllers And Operations

Keep decorators next to the HTTP adapter in `controller/` or in composed decorators that the project already uses:

- `@ApiTags` by functional area, with readable and consistent names such as `Auth` or `Carriers`.
- `@ApiOperation({ summary, description })`: short summary and useful description of behavior, requirements, effects, restrictions, and response alternatives. Preserve `deprecated` notices and replacement routes.
- `@ApiBody`, `@ApiParam`, `@ApiQuery`, and `@ApiHeader` according to real input, with types, required flags, descriptions, and examples.
- `@ApiResponse` or variants for real success and error cases. Document the effective NestJS status and any `@HttpCode`; do not assume every POST returns 200.
- Concrete response types or schemas with properties, formats, and examples. For response variants, preserve named examples that explain each result, such as normal quote versus manual shipment.
- Technical descriptions and internal names are written in English, following EG backend controllers and DTOs. Preserve existing content language unless translation was requested. Public error examples follow the configured public language of the EG handler.

For named OpenAPI 3 examples, use `content['application/json'].examples` together with the schema for the same media type. Do not copy an incorrect `examples` placement just because it exists in old code. When correcting it, preserve the examples and their meaning.

## DTOs And Schemas

Transport DTOs keep `@ApiProperty` / `@ApiPropertyOptional` together with validators. Specify description, realistic example, type, format, enum, limits, arrays, and nested models when relevant. EG style example:

```typescript
export class LoginDto {
  @ApiProperty({
    description: 'User email address.',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

The fragment requires local imports from `@nestjs/swagger` and `class-validator`. Reuse DTO classes and do not convert them to interfaces when runtime metadata would be lost. If the project uses the Swagger plugin, preserve its configuration and verify the generated schema before removing decorators that look redundant.

Register models that are not discovered automatically with `extraModels` or `@ApiExtraModels`. Keep references resolvable and use `getSchemaPath` for composition when needed. Pure domain entities do not carry Swagger decorators; map them to HTTP adapter response classes. Preserve response wrappers, pagination, and interceptor transformations in the documentation.

## Authentication And Errors

The reference backend registers these scheme names: `jwt` (HTTP bearer JWT), `API_KEY` (`X-API-Key`), `ADMIN_API_KEY` (`X-Admin-Api-Key`), and `PAGO_MEET_API_KEY` (`X-Pago-Meet-Api-Key`). Keep registered names when they exist; in another backend, declare only its real mechanisms.

Use `@ApiBearerAuth('jwt')` for JWT and `@ApiSecurity('ADMIN_API_KEY')` or the corresponding API key name. The decorator documents the mechanism; it does not replace the guard. Avoid renaming a builder scheme without updating operations. If an operation requires multiple mechanisms at the same time, represent them as AND in the same security requirement; do not document them as OR alternatives.

Document errors according to [error-handling.md](error-handling.md): `statusCode`, `timestamp`, `path`, `method`, `message` in the configured public language (English by default in new projects; Spanish only for explicitly configured EG projects), `originalMessage` in English, and `details` when applicable. Do not add a top-level `code` field that the current filter does not return. Examples must not include real tokens or sensitive information.

## Change Flow And Verification

1. Before editing, inspect setup, bootstrap call, plugin configuration if present, affected controllers/DTOs, contracts, and JSON/UI endpoints. Identify composed decorators and shared models so indirect metadata is not lost.
2. Apply the change while preserving registration and moving documentation together with moved files. Update contract arrays and schema references.
3. Review the diff for lost `Api*`, `setupSwagger`, `SwaggerModule`, `extraModels`, security schemes, scripts, and UI options. Code reduction does not prove documentation was preserved.
4. If OpenAPI can be generated locally without external services, compare before/after routes and methods, tags, summaries, descriptions, parameters, requestBody, responses, examples, deprecations, security, and `components.schemas`. Counting endpoints is not enough; also check that affected `$ref` values resolve.
5. Verify that server + path creates the real URL without duplicating or losing the global prefix. Preserve bootstrap order unless the change requires altering it; when it changes, specifically verify this point.
6. When the environment allows it, check UI, JSON, and download, including headers and button behavior. Run relevant type/build checks. If startup requires unavailable databases or credentials, perform static review and state which generation/runtime checks remain pending; do not claim Swagger works just because imports were preserved.

Do not start production services or call real providers to validate documentation. Do not create a new test suite for a small documentation change; choose checks proportional to the scope.
