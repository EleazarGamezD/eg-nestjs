# EG Environment Configuration

## Core Rule

Do not read raw environment variable names throughout services or business logic. Avoid patterns like:

```typescript
this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
this.configService.get<string>('WOMPI_PRIVATE_KEY');
process.env.WOMPI_PRIVATE_KEY;
```

Environment access should be centralized and typed. Follow the existing EG style:

- Group related values in `src/core/config/configuration.ts` under typed keys such as `wompiKeys`, `firebaseConfig`, `redisKeys`, `stripeKeys`, `otpService`, or `authApi`.
- Keep the `IConfiguration` type as the contract for those groups.
- Read grouped config with typed paths such as `configService.get<IConfiguration['wompiKeys']>('wompiKeys')`.
- For module-level third-party setup that must read direct env names, use env enums such as `MailEnv.MAIL_HOST`, not inline string literals.
- For required values, prefer `configService.getOrThrow<T>(key)` so the application fails fast during bootstrap instead of failing later inside a request.

This is an EG preference even when NestJS examples use `config.get<string>('RAW_ENV_NAME')`. Treat raw env strings inside services, controllers, repositories, processors, gateways, and helpers as a smell to refactor. Narrow platform-agnostic configuration files have a specific exception below.

## Where Values Belong

Use `configuration.ts` as the default place to map `process.env` into typed application configuration:

```typescript
export type IConfiguration = {
  firebaseConfig: {
    projectId: string | undefined;
    privateKey: string | undefined;
    privateKeyId: string | undefined;
    clientEmail: string | undefined;
    fcmEnabled: boolean;
  };
  wompiKeys: {
    baseURL: string | undefined;
    publicKey: string | undefined;
    privateKey: string | undefined;
    eventKey: string | undefined;
    integritKey: string | undefined;
  };
};

export default (): IConfiguration => ({
  firebaseConfig: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    fcmEnabled: process.env.FCM_ENABLED === 'true',
  },
  wompiKeys: {
    baseURL: process.env.WOMPI_API_URL,
    publicKey: process.env.WOMPI_PUBLIC_KEY,
    privateKey: process.env.WOMPI_PRIVATE_KEY,
    eventKey: process.env.WOMPI_EVENT_KEY,
    integritKey: process.env.WOMPI_INTEGRITY_KEY,
  },
});
```

Then consume the typed group:

```typescript
import { IConfiguration } from '@core/config/configuration';

private readonly wompi = this.configService.getOrThrow<IConfiguration['wompiKeys']>('wompiKeys');
```

When using optional integrations such as Firebase, read the grouped config once and validate the required subset explicitly:

```typescript
const firebaseConfig = this.configService.getOrThrow<IConfiguration['firebaseConfig']>('firebaseConfig');
const privateKey = firebaseConfig.privateKey?.replace(/\\n/g, '\n');

if (!privateKey || !firebaseConfig.projectId || !firebaseConfig.clientEmail) {
  this.logger.warn('Firebase credentials are not configured. Firebase Admin SDK will not be initialized.');
  return;
}
```

Do not scatter `firebaseConfig.projectId`, `firebaseConfig.privateKey`, and similar paths across many services. Prefer one config adapter/service per integration when the setup is reused.

## Allowed `process.env` Exceptions

Direct `process.env` access is allowed in files that must run outside the NestJS dependency-injection platform or have a dual purpose for both the application and external tooling. Typical examples are TypeORM datasource/migration configuration files, standalone CLI configuration, early bootstrap guards before Nest is created, and the central `configuration.ts` mapper itself.

For TypeORM datasource files, the file may call `dotenv.config()` and read `process.env` directly because the same config is consumed by migrations and by the application connection:

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DataSourceOptions } from 'typeorm';

dotenv.config();

const useSsl = process.env.DB_SSL === 'true';

export const commonDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: ['error', 'warn'],
  useUTC: true,
};

export const typeOrmConfig: TypeOrmModuleOptions = {
  ...commonDataSourceOptions,
  autoLoadEntities: true,
};
```

Keep the exception narrow:

- Use it only for files that genuinely need to run without NestJS `ConfigService`.
- Keep raw env reads inside that configuration boundary, not in services or domain logic.
- Parse and normalize values in the config file, such as `Number(process.env.DB_PORT)` and boolean flags.
- Preserve production safety flags such as `synchronize: false`.
- Prefer reusing the same exported config for both migrations and the app connection to avoid drift.
- Do not use this exception as a shortcut in injectable services where grouped `IConfiguration`, env enums, or `getOrThrow` are available.

## Module Async Configuration

For `forRootAsync` / `registerAsync` modules, use `ConfigService` in the factory but keep access typed and fail fast for required values.

When the module uses a grouped configuration object, load the group once into a clearly named constant and build the module options from that object. Do not call `configService.get(...)` repeatedly for each property when the group already exists in `IConfiguration`.

Database style:

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    uri: configService.getOrThrow<IConfiguration['connectionUrl']>('connectionUrl'),
  }),
});
```

Grouped database/provider style:

```typescript
type DatabaseKeys = {
  host: string | undefined;
  port: number | undefined;
  username: string | undefined;
  password: string | undefined;
  database: string | undefined;
  ssl: boolean;
};

// In IConfiguration:
// databaseKeys: DatabaseKeys;

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const databaseConfig = configService.getOrThrow<DatabaseKeys>('databaseKeys');

    return {
      type: 'postgres',
      host: databaseConfig.host,
      port: databaseConfig.port,
      username: databaseConfig.username,
      password: databaseConfig.password,
      database: databaseConfig.database,
      ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
      synchronize: false,
      autoLoadEntities: true,
    };
  },
});
```

For grouped provider config such as `wompiKeys`, `stripeKeys`, `redisKeys`, or `firebaseConfig`, use the same shape: `const wompiConfig = configService.getOrThrow<IConfiguration['wompiKeys']>('wompiKeys')`, then reference `wompiConfig.baseURL`, `wompiConfig.publicKey`, and the other fields. If some fields are optional, validate the required subset once after loading the group and keep the fallback/skip behavior explicit.

Mailer style, when direct env keys are already modeled as enums:

```typescript
Mailer.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    transport: {
      host: configService.getOrThrow<string>(MailEnv.MAIL_HOST),
      port: Number(configService.getOrThrow<string>(MailEnv.MAIL_PORT)),
      secure: configService.get<string>(MailEnv.MAIL_SECURE) === 'true',
      auth: {
        user: configService.getOrThrow<string>(MailEnv.MAIL_USER),
        pass: configService.getOrThrow<string>(MailEnv.MAIL_PASS),
      },
    },
    defaults: {
      from: `"No Reply" <${configService.getOrThrow<string>(MailEnv.MAIL_FROM)}>`,
    },
  }),
});
```

Use `get` only for optional values or values with a documented fallback. Use `getOrThrow` for secrets, connection URLs, API keys, host/user/password pairs, and anything required for the feature to start correctly. If an integration is intentionally optional, use grouped config and explicitly log/skip initialization when the required subset is absent.

## Env Enums

Env enum files belong in `src/core/enums/envs/` or the existing equivalent location. Use them when a module must reference concrete environment variable names directly, as with `MailEnv`.

```typescript
export enum MailEnv {
  MAIL_USER = 'MAIL_USER',
  MAIL_PASS = 'MAIL_PASS',
  MAIL_HOST = 'MAIL_HOST',
  MAIL_PORT = 'MAIL_PORT',
  MAIL_FROM = 'MAIL_FROM',
  MAIL_SECURE = 'MAIL_SECURE',
}
```

Do not create duplicate enum members for a variable that is already mapped into `IConfiguration` and consumed as a grouped config object. Choose one clear path per integration:

- grouped typed config for application/provider configuration used by services;
- env enums for module factories that naturally consume raw env key names.

## Refactoring Existing Code

When touching code that uses `configService.get<string>('RAW_ENV')` or `process.env` outside configuration/bootstrap/allowed tooling config:

1. Check whether the value already exists in `IConfiguration` or an env enum.
2. Reuse the existing key if present.
3. If missing, add it to the proper typed config group or env enum.
4. Replace raw string access with typed grouped access or enum access.
5. Use `getOrThrow` for required values and explicit optional handling for optional integrations.
6. Run TypeScript checks for the affected module.

Do not perform a large unrelated env refactor just because one file is touched. Apply this rule within the requested scope, and call out remaining raw env access if it is outside scope.
