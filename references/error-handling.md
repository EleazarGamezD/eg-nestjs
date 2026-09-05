# Manejador de errores EG dentro del backend

## Origen y alcance

Implementación extraída de `mm-nestjs-shared` 3.5.8, biblioteca del propietario de este skill. Las plantillas del descriptor y las excepciones conservan textualmente el código inspeccionado. La plantilla del filtro conserva el manejo HTTP y los logs, dejando la integración de Sentry comentada y sin requerir un parámetro de nombre del backend. Son archivos para incorporar al backend, no instrucciones para instalar la biblioteca privada. No añadir `@mercado-meet/mm-nestjs-shared` a dependencias ni usar imports desde ese paquete para implementar este manejador.

Esta referencia especializa la sección 3 de la guía completa: conservar sus prácticas de propagación y filtros, usando el contrato EG para las nuevas excepciones personalizadas. No sustituir ni duplicar un filtro global equivalente que el backend ya tenga.

## Archivos locales

Copiar o integrar según los archivos existentes:

| Plantilla del skill | Destino en el backend |
| --- | --- |
| [error-message.ts](../assets/error-handling/core/errors/error-message.ts) | `src/core/errors/error-message.ts` |
| [custom-exception.ts](../assets/error-handling/core/exceptions/custom-exception.ts) | `src/core/exceptions/custom-exception.ts` |
| [global-exception.filter.ts](../assets/error-handling/core/filters/global-exception.filter.ts) | `src/core/filters/global-exception.filter.ts` |

Definir los descriptores de cada dominio en `src/core/messages/<domain>.messages.ts`. Resolver los imports locales con los aliases reales del backend. Las plantillas ya usan imports relativos entre sus tres archivos.

El filtro original usa Express (`Request`, `Response`, `response.status().json()`). Para Fastify adaptar el acceso al request y el envío mediante su reply o `HttpAdapterHost`, preservando el contrato; no copiar las firmas Express literalmente.

## Descriptores y excepciones

```typescript
// src/core/messages/orders.messages.ts
import { createErrorMessage } from '../errors/error-message';

export const ORDER_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: createErrorMessage({
    en: 'Order not found',
    es: 'No se encontró el pedido',
    code: 'ORDER_NOT_FOUND',
  }),
} as const;
```

En un servicio de aplicación, importar localmente `CustomNotFoundException` y el descriptor, y lanzar `new CustomNotFoundException(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND)`.

- `CustomException` extiende `BadRequestException`: HTTP 400.
- `CustomNotFoundException` extiende `NotFoundException`: HTTP 404.
- Ambas construyen `{ status, message, originalMessage }`; el descriptor permanece en `message` hasta que el filtro lo resuelve.
- `ErrorMessageInput` acepta strings, descriptores y arrays homogéneos de cualquiera de ellos por compatibilidad. Para nuevas excepciones personalizadas usar siempre descriptores localizados.
- `createErrorMessage` devuelve el descriptor recibido; no registra traducciones ni valida en runtime. `code` es opcional en el tipo original, pero definirlo en todos los descriptores nuevos.
- `resolveErrorMessage` selecciona `es` por defecto; `resolveOriginalErrorMessage` selecciona `en`. Ambos resuelven arrays recursivamente. Los strings heredados se conservan.
- Entidades y valores del dominio puro no importan excepciones HTTP: traducir sus fallos en servicios de aplicación o en el límite de transporte.

## Contrato HTTP exacto

El filtro devuelve:

```json
{
  "statusCode": 404,
  "timestamp": "2026-09-05T12:00:00.000Z",
  "path": "/orders/123",
  "method": "GET",
  "message": "No se encontró el pedido",
  "originalMessage": "Order not found",
  "details": {
    "status": 404,
    "originalMessage": "Order not found"
  }
}
```

`details` es condicional. En estas excepciones personalizadas conserva `status` y `originalMessage` porque el filtro solo elimina `message`, `statusCode`, `error` y `stack`. El `code` del descriptor **no se publica como campo superior** en esta implementación. No inventar ese campo ni cambiar el contrato silenciosamente.

| Entrada | Comportamiento original |
| --- | --- |
| `HttpException` | Conserva `getStatus()`; extrae un descriptor directo, `response.message` o un string |
| Array de mensajes | Resuelve los elementos y los une con `; `, tanto en español como en el original |
| `property X should not exist` | Traduce a `La propiedad X no debe existir.` solo en `message` |
| `Error` cuyo mensaje contiene `Not allowed by CORS` | HTTP 403 con mensaje CORS español/inglés |
| Otro `Error` | HTTP 500, español genérico e inglés tomado de `exception.message` |
| Valor desconocido | HTTP 500 con mensajes genéricos español/inglés |
| Cualquier estado >= 500 | Omite `details` |

El filtro no traduce automáticamente todos los mensajes de class-validator: únicamente el patrón indicado. Para nuevas validaciones que requieran español, configurar mensajes apropiados o ampliar la traducción deliberadamente con pruebas.

**Detalle de compatibilidad:** `originalMessage` se envía al cliente, incluso en 500, y puede contener el diagnóstico técnico original. `cleanDetails` elimina cuatro claves, no hace una limpieza recursiva ni una lista de campos autorizados. No incluir secretos o datos privados en excepciones HTTP. Si la tarea pide ocultar diagnósticos de producción, devolver un original genérico para 500 y conservar el diagnóstico en logs como un cambio explícito del contrato; las plantillas adjuntas conservan el comportamiento original.

## Registro global

Registrar una sola vez, después de crear la aplicación:

```typescript
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

// Dentro de bootstrap, con app ya creada:
app.useGlobalFilters(new GlobalExceptionFilter());
```

Si el proyecto registra filtros mediante `APP_FILTER`, integrar este filtro mediante un proveedor en lugar de registrarlo también con `useGlobalFilters`. El manejador usa el logger de NestJS y no requiere un servicio externo de monitoreo.

Todos los fallos se registran con `Logger.error`, incluyendo método, URL, estado, contexto y mensaje original; cuando hay `Error`, se añade su stack. El contexto intenta `Controller.handler` y, si no está disponible, usa módulo inferido de la URL y plantilla de ruta. La inferencia reconoce `/api/v*/<module>`; adaptar prefijos distintos cuando corresponda.

El filtro está diseñado para HTTP. Los consumidores RPC, colas y WebSockets necesitan su propio adaptador de errores; no llamar `switchToHttp()` sobre esos contextos.

## Verificación al integrarlo

Probar el contrato observable con el runner del backend: 400/404 localizados; mensajes heredados; arrays; traducción de propiedades prohibidas; CORS 403; error desconocido 500; ausencia de `details` para 500; limpieza de campos para 4xx; contexto en logs. Verificar también el registro global con una solicitud HTTP y los imports locales mediante tipos/build.

## Sentry: referencia comentada para activación bajo pedido

La plantilla contiene el import y el bloque originales de captura como comentarios, sin dependencia activa. No instalar ni activar Sentry por defecto. Si el usuario lo solicita:

1. Reutilizar la integración central del backend o configurar el SDK público `@sentry/nestjs` siguiendo la versión que utilice el proyecto, con credenciales desde configuración de entorno.
2. Descomentar el import y el bloque `Sentry.withScope` de la plantilla. Sustituir `your-backend-name` por el nombre estable del servicio o su configuración equivalente.
3. Mantener la captura solo para estados >= 500, la etiqueta `service` y el mecanismo mostrado. Conservar la respuesta HTTP y el logger existentes.
4. Verificar con un doble sin red que un 500 se captura con la etiqueta correcta y un 400/404 no se captura. Revisar la integración existente para evitar reportar dos veces la misma excepción.

Esta integración usa el SDK público, nunca la biblioteca privada de EG.
