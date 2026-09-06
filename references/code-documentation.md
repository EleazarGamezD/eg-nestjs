# EG Code Documentation And Contract Files

## Function JSDoc

Document new or meaningfully changed functions with JSDoc when they contain business logic, application flow, data transformation, integration behavior, validation, authorization, queue processing, WebSocket emission, monitoring, or reusable helper logic. The goal is to explain intent and usage for another developer, not to restate TypeScript syntax.

Each JSDoc block should include:

- A short description of what the function does and the rule or workflow it protects.
- `@param` entries for parameters whose meaning is not obvious from the name and type.
- `@returns` for every non-void function, describing the semantic result, not only the TypeScript type.
- `@example` with a realistic call when the function is public, reused, non-trivial, or likely to be copied.
- `@throws` when the function intentionally throws domain, validation, HTTP, provider, or authorization errors.

```typescript
/**
 * Maps a Firebase provider identifier to the backend social-login source.
 *
 * @param providerId - Firebase provider identifier received from the verified token.
 * @returns The internal social-login source used by auth audit and user creation flows.
 * @throws CustomException when the provider is unsupported by the backend contract.
 *
 * @example
 * const source = resolveSocialLoginSource(AuthProvider.GOOGLE);
 */
export function resolveSocialLoginSource(providerId: AuthProvider): SocialLoginSource {
  const source = FIREBASE_PROVIDER_MAP[providerId];
  if (!source) {
    throw new CustomException(AUTH_ERROR_MESSAGES.UNSUPPORTED_PROVIDER);
  }
  return source;
}
```

Do not add noisy JSDoc to trivial NestJS lifecycle methods, one-line private delegates, plain constructors, or framework overrides whose behavior is already obvious unless the method has project-specific behavior. Keep comments updated when behavior changes. Prefer English for descriptions and examples.

## Interfaces, Types, And Enums Belong In Contract Files

Do not define interfaces, type aliases, enums, injection tokens, event names, queue names, or provider maps inline inside services, controllers, repositories, processors, or gateways. Put contracts in their own files and folders so services contain behavior instead of local type/catalog declarations.

Use the existing project structure first. For new EG modules, follow these defaults:

- Shared enums: `src/core/enums/<domain>/<name>.enum.ts`.
- Shared interfaces: `src/core/interfaces/<domain>/<name>.interface.ts` or the project's existing `interface/` naming when that is already established.
- Shared type aliases: `src/core/types/<domain>/<name>.type.ts`.
- Shared constants/maps: `src/core/constants/<domain>/<name>.constants.ts` when they are not enums.
- Feature-only enums: `src/modules/<feature>/domain/enums/<name>.enum.ts`.
- Feature-only interfaces: `src/modules/<feature>/domain/interfaces/<name>.interface.ts`.
- Feature-only types: `src/modules/<feature>/domain/types/<name>.type.ts`.
- Infrastructure/provider contracts: inside the owning adapter/infrastructure folder when they are not shared by the domain.

For example, `SocialLoginSource`, `AuthProvider`, and `FIREBASE_PROVIDER_MAP` belong in `src/core/enums/social-login/social-login.enum.ts` or equivalent shared auth/social-login contract files, not inside `auth-o2auth.service.ts`.

If a declaration is used only by one function but expresses a business contract, provider contract, transport shape, event name, status, or queue/job name, still move it to an appropriate contract file. If it is only a tiny implementation detail with no reusable or semantic value, keep it local only when extracting it would reduce clarity.

## Refactoring Existing Code

When touching a service that already contains inline interfaces, types, enums, provider maps, queue names, or event names, extract the declarations that belong to contracts as part of the change if it is within scope. Preserve serialized values, public names, and imports. Update Swagger/AsyncAPI decorators, validation, persistence schemas, and tests that reference the moved declaration.

Avoid circular imports when moving shared contracts. `core` must not import feature modules. If moving a feature declaration to `core` would create a dependency from `core` back into a module, keep it in the feature domain or introduce a small shared contract that both sides can depend on safely.

Run TypeScript checks after moving contracts. For broad moves, search for duplicate declarations and stale string literals that should now reference the extracted enum/type/interface.
