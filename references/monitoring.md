# EG Bull Board And Status Monitor

## When To Apply

Use this guide when a backend already uses queues and the task asks to implement or configure queue administration. When adding queues to a backend that already has Bull Board, include them in the existing dashboard. Do not introduce Redis, queues, or an admin panel just because this skill is active for an unrelated task.

When the user asks to "replicate the monitor", "add my status monitor", or equivalent, reproduce the attached EG monitor with the same HTML/CSS, access form, cards, charts, metrics, and behavior. Do not replace it with a generic dashboard, Grafana, or `nest-status-monitor`. Preserve Swagger and its links to any tools that are implemented.

## Complete Templates

The sources live in [../assets/monitoring/](../assets/monitoring/), preserving their original `src/` routes. They are a copy from the EG backend at the time this reference was created, so they do not depend on the original repository being present in the target machine:

- [StatusMonitorController](../assets/monitoring/src/modules/monitoring/status/status-monitor.controller.ts): complete dashboard HTML, CSS, and JavaScript.
- [Exact Status Monitor HTML](../assets/monitoring/status-monitor.html): markup, styles, and script extracted from the original controller so the UI can be copied, compared, or ported without rewriting it.
- [RuntimeStatusService](../assets/monitoring/src/modules/monitoring/status/runtime-status.service.ts): metrics calculation and rolling window.
- [RequestMetricsMiddleware](../assets/monitoring/src/modules/monitoring/status/request-metrics.middleware.ts): request and byte measurement.
- [MonitoringModule](../assets/monitoring/src/modules/monitoring/monitoring.module.ts): original composition with Terminus and Prometheus.
- [MonitoringController](../assets/monitoring/src/modules/monitoring/monitoring.controller.ts): MongoDB/Redis readiness and liveness.
- [RedisHealthIndicator](../assets/monitoring/src/modules/monitoring/health/redis.health.indicator.ts): Redis ping.
- [CustomPrometheusController](../assets/monitoring/src/modules/monitoring/prometheus/custom-prometheus.controller.ts): protected metrics and `GRAFANA_ENABLED` flag.
- [setupBullBoard](../assets/monitoring/src/modules/client/notification/whatsapp-webhook/services/bull-board.ts): Bull/Express adapter and router.
- [Original bootstrap fragments](../assets/monitoring/bootstrap-reference.ts.txt): authentication, dashboard mounting, Bull Board, and global-prefix exclusions. These fragments were extracted from `main.ts`; if the target backend uses another bootstrap file, apply the same functional setup there.

These sources belong to EG's owner. Do not automatically apply the third-party NestJS guide's MIT license to them. Adapt private or product-specific references as described below; do not install `@mercado-meet/mm-nestjs-shared` to port the monitor.

## Fidelity And Organization

Read the complete templates before implementing. Copy the UI and metrics logic instead of summarizing or redesigning them. Change only the backend identity, URLs/prefix, and required connections. Preserve the design and flow. For a replica inside the same product, preserve the original title too.

The monitor HTML is part of the replication contract. When the user asks for the EG monitor, use the complete content of [../assets/monitoring/status-monitor.html](../assets/monitoring/status-monitor.html) or the inline template in `StatusMonitorController.page()` as the direct source. Do not substitute an "equivalent" screen. Keep its visual structure: centered login overlay, `#f2f4f7` background, white cards with `#dfe3e8` borders, Segoe UI/Arial typography, `auto-fit` card grid, chart containers, Chart.js 4.4.3, DOM ids, and JavaScript functions. The skill template uses English UI text by default; adapt user-facing text only when the target project explicitly requires another language. Only adapt concrete values required by the target project, such as backend name, real routes, global prefix, health URL, or serving Chart.js locally when CSP does not allow CDN usage.

The logic is also part of the contract. Port `StatusMonitorController`, `RuntimeStatusService`, and `RequestMetricsMiddleware` together; do not copy only the HTML. The controller serves the page, exposes `GET /status/data`, and uses the service for snapshots. The service maintains the metrics rolling window and calculates CPU, memory, latencies, throughput, error ratios, status codes, and event-loop lag. The middleware feeds the service from every request and prevents double counting between `finish` and `close`. If one of the three is missing, the replica is incomplete.

In a new module, follow the requested or detected architecture and group files by responsibility. For a feature-first layout, example destinations are: `src/modules/monitoring/controller/`, `services/`, `module/`, and `middlewares/` for the custom middleware. Update imports when moving templates. Place health indicators in their responsibility folder within the existing infrastructure/adapter layer or monitoring feature. If the project already has this module, integrate without duplicating providers or routes. The reusable Bull Board helper can live in `src/core/config/bull-board/`; do not place it under WhatsApp in a project that does not have that domain.

The source project's `src/core/config/status-monitor/config/status-monitor.ts` is not connected to the active dashboard. Copying that object or installing `nest-status-monitor` is not enough. The requested monitor is implemented by `StatusMonitorController`, `RuntimeStatusService`, and `RequestMetricsMiddleware`.

## Fast Mounting Path

When the user asks to implement the monitor, directly wire these pieces:

1. Copy/adapt the complete templates from `assets/monitoring/src/modules/monitoring/` into the target backend's monitoring module, respecting local organization. In new EG projects, move `status-monitor.controller.ts` to `controller/`, `runtime-status.service.ts` to `services/`, and `request-metrics.middleware.ts` to `middlewares/` if that structure is being used.
2. Register `RuntimeStatusService`, `StatusMonitorController`, and `RequestMetricsMiddleware` in `MonitoringModule`. If a monitoring module already exists, integrate there without duplicating controllers or providers.
3. Apply `RequestMetricsMiddleware` to the real HTTP routes and exclude `/status`, the status data prefix, `/health`, `/metrics`, and Bull Board to avoid noise and recursion.
4. Mount bootstrap protection using `assets/monitoring/bootstrap-reference.ts.txt`: visible `/status` landing page, data protected with `ADMIN_API_KEY`, Bull Board protected with Basic Auth when queues exist, and routes aligned with the real global prefix.
5. Verify that the controller's inline HTML matches `assets/monitoring/status-monitor.html` except for intentional name/route/CSP changes. If the global prefix changes, update the HTML fetch calls too.
6. Keep or adapt `MonitoringController`, `RedisHealthIndicator`, and `CustomPrometheusController` only when the backend has those dependencies or the user asks for health/Prometheus together with the monitor.
7. Update Swagger with links to `/status`, `/admin/queues`, and `/metrics` when those routes exist, preserving the previous Swagger setup.

## Required Bootstrap / main.ts Wiring

The monitor and Bull Board are not complete by copying modules alone. Also replicate the MM backend startup configuration. It usually lives in `src/main.ts`, but if the project uses `bootstrap.ts`, `server.ts`, an HTTP factory, or another entrypoint, apply the same functional steps there.

- Create a helper equivalent to `getApiKeyFromRequest(req)` that reads `x-admin-api-key` and `?key=`. The HTML uses the header; the query parameter exists for manual compatibility.
- Get `expressInstance` through `app.getHttpAdapter().getInstance()` before mounting dashboards. This reference assumes Express; for Fastify, adapt to the equivalent middleware/plugin mechanism and verify real routes.
- Mount `statusAuthMiddleware` on `/status` and on the prefixed route that exposes data, for example `/api/v2/status`. The `GET /status` landing page remains visible to show the form; `GET /status/data` and `/api/v2/status/data` must require `ADMIN_API_KEY`.
- Status validation uses exactly `process.env.ADMIN_API_KEY`; do not publish data when the variable is missing or does not match. Return 401 with a clear message when the key is invalid.
- When queues exist, mount Bull Board in bootstrap with `expressInstance.use('/admin/queues', bullBoardAuthMiddleware, setupBullBoard(realQueues))`. Resolve real queues with `app.get(getQueueToken(queueName))` using the target project's enums/tokens.
- Keep Basic Auth for Bull Board as in the MM backend: read `Authorization: Basic`, decode username/password, compare only the password against `ADMIN_API_KEY`, return `WWW-Authenticate` with the product realm and 401 when it fails.
- Mount Swagger, AsyncAPI, and the docs viewer according to the project without deleting their configurations. In the MM backend, `setupSwagger(app)`, `await setupAsyncApi(app)`, and `setupDocsViewer(app)` run before `setGlobalPrefix`.
- Configure `app.setGlobalPrefix(...)` to exclude operational root-level routes: `health`, `health/live`, `metrics`, `status`, and `admin/queues`. If the project uses another prefix, adjust protected routes and HTML fetch calls at the same time.
- Register the request metrics middleware in the module or entrypoint so it captures real requests, excluding status, health, metrics, and Bull Board. Without this middleware, the dashboard may load but HTTP metrics will be empty or wrong.

## Monitor Behavior To Preserve

- `/status` page, title, light background, responsive cards, login overlay from the EG HTML, and six Chart.js charts: CPU, RSS memory, mean response, event loop, traffic, and errors.
- Complete HTML, CSS, and JavaScript from `assets/monitoring/status-monitor.html`; preserve ids, classes, functions, layout, and series so the dashboard keeps the same design and behavior.
- Chart.js 4.4.3 is loaded from CDN in the source. Keep it or serve the same resource locally when the environment requires it; respect the existing CSP.
- Cards for CPU, RSS, load average, mean/p95/p99 latency, requests per second, incoming/outgoing bytes, active requests, lag, 4xx/5xx ratios, heap, and status codes.
- Poll every 2 seconds with 30 chart samples; request metrics use a 60-second rolling window. CPU updates every second; lag updates every 500 ms with smoothing. Do not convert rolling-window rates into instant rates unless requested.
- Data fetch uses `/api/v2/status/data` in the source and health uses `/health`; adapt every occurrence if the prefix changes. Support direct responses and `{ data: ... }` wrappers as the original UI does.
- Keep the API key only in browser memory and send it through `x-admin-api-key`. Login checks the key against data before closing the overlay; on failure it stops polling and shows the access form again. Do not store the key in localStorage or embed it in HTML.
- Middleware excludes `/status`, `/api/v2/status`, `/metrics`, and `/admin/queues`; register only one completion between `finish` and `close` to avoid double counts. Keep chunk measurement and content-length fallback.
- Timers use `unref` and are released in `onModuleDestroy`; integrate application shutdown according to the project.

The metrics are for this Node process, not the whole cluster. Throughput represents bytes observed by the middleware, not total network-interface traffic. History is in memory and resets with the process. `/status/health` in the controller is a small helper that only reports `keyProvided`; it does not replace the real health check used by the UI.

## Protection And Routes

The UI alone does not protect the endpoints. The original controller depends on the attached bootstrap middleware. Port both.

- Allow `GET /status` landing HTML so the form can render.
- Protect `/api/v2/status/data` and other monitor data routes with `ADMIN_API_KEY`. The source accepts `x-admin-api-key` or query `key`; the UI uses the header. Never introduce a bypass when the environment variable is missing.
- Mount access middleware on `/status` and the real prefixed status route before route registration. Validate the variable at startup or before serving metrics, and never publish metrics because the mount was forgotten.
- Preserve global-prefix exclusions for `/status`, `/health`, `/health/live`, `/metrics`, and `/admin/queues` when present. The source keeps data under `/api/v2/status/data`; check effective routes and do not accidentally exclude the whole subtree.
- Keep health accessible according to probe needs. If Prometheus exists, `/metrics` is protected by an admin guard.

## Bull Board With Queues

The original implementation uses Bull (`bull`, `@nestjs/bull`), `@bull-board/api`, `@bull-board/express`, `BullAdapter`, and Express. Reuse the project's installed versions. If the project already uses BullMQ, use `BullMQAdapter` and tokens from `@nestjs/bullmq`; do not migrate engines or mix types just to copy this panel.

1. Get registered queue instances from Nest with `getQueueToken(realName)` in the root composition. Do not create duplicate connections or queues only for the dashboard.
2. Pass them to `setupBullBoard(queues)` and include every queue that should be administered. The WhatsApp and Carrier constants in the fragment belong to the original project; replace them with existing target tokens.
3. Keep `serverAdapter.setBasePath('/admin/queues')` consistent with the Express mount and Swagger links.
4. Mount `expressInstance.use('/admin/queues', bullBoardAuthMiddleware, router)`. The middleware protects the HTML, assets, and API.
5. Preserve the original Basic Auth behavior: compare the password with `ADMIN_API_KEY`; the username is not validated. The source uses the `Mercado Meet Admin` realm, which can be adapted to the backend identity. Without valid credentials, return 401 with `WWW-Authenticate`.
6. Do not mount an empty board or resolve nonexistent tokens when the project has no queues.

The panel preserves the administrative operations available in the original adapter. Do not expose it publicly. Use the attached middleware as the base and follow the backend's configuration validation.

## Health And Prometheus Dependencies

The base dashboard needs NestJS/Express, Node APIs, and Chart.js in the browser. It does not require Sentry, a private library, or Grafana. The original module adds Terminus, Mongoose, Redis, and Prometheus; include those pieces only if they are already present or if the user requests that full set.

In `RedisHealthIndicator`, replace the private `REDIS_SESSION_CLIENT` import with the locally registered Redis client token, and import the module that exports it. Do not create a string token with that name unless it is connected to a real provider. In a backend with another database, adapt the health check to the existing connection without introducing MongoDB.

`CustomPrometheusController` references `AdminApiKeyGuard`, `isEnvFlagEnabled`, and `MONITORING_ERROR_MESSAGES` from the original backend. Reuse local equivalents or implement them inside `core`: an admin API key guard, an explicit environment boolean parser, and a localized descriptor for disabled endpoints. Preserve the `GRAFANA_ENABLED` flag, which enables/disables `/metrics` in this implementation even if Grafana is not installed. Do not copy unresolved imports or a private re-export.

If only the dashboard is requested, compose a minimal module with the controller, service, middleware, and a real `/health` suitable for the backend. Keep every visual element and the monitor data contract.

## Verification

- Types/build and local imports work without a new private dependency.
- Landing HTML is available; data is denied with no key or a wrong key and allowed with the correct key.
- Browser check: overlay, six charts, cards, polling, health badge, and return to login on failure, with no unjustified visual changes.
- Middleware: `finish` followed by `close` counts once and leaves active requests at zero; exclusions are respected.
- Bull Board: 401/challenge without authentication and access with correct credentials, real queues visible, and base path correct for assets/API. Use an isolated local environment; do not retry or delete real jobs just to verify the UI.
- If health/Prometheus are included, check endpoints and access control; check existing and added Swagger links.
- State any verification skipped because Redis, a browser, or local services were unavailable. Do not claim visual fidelity after static review only.
