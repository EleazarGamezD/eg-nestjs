# EG NestJS

Skill personal basado en el documento completo **NestJS Best Practices 1.1.0**, de Kadajett, cuyo skill de origen declara licencia MIT.

## Contenido completo

[AGENTS.md](AGENTS.md) conserva las 40 reglas con sus explicaciones y ejemplos correctos/incorrectos, distribuidos en arquitectura, inyección de dependencias, errores, seguridad, rendimiento, pruebas, base de datos, diseño de APIs, microservicios y operación.

La única sección reemplazada es **1.2: organización de módulos**, junto con su enlace en el índice. Se adapta a DDD/arquitectura hexagonal con `services/`, `controller/`, `module/`, dominio, puertos, infraestructura y el `core` compartido de EG. Las otras 39 secciones numeradas se conservan textualmente, incluidos sus ejemplos.

[SKILL.md](SKILL.md) es el punto de entrada, con el índice de prácticas y la convención adicional de errores localizados del repositorio EG. No requiere instalar el skill original. `agents/openai.yaml` contiene los metadatos de interfaz.

## Uso y distribución

Copiar esta carpeta completa como `.agents/skills/eg-nestjs/` en un proyecto que use ese directorio de skills. Invocación de ejemplo:

```text
Usa $eg-nestjs para implementar este módulo siguiendo la guía completa
 y la estructura de carpetas DDD/hexagonal de EG.
```

La carpeta es autocontenida y está preparada para subirla como un repositorio de GitHub. Conserva la atribución del material de origen al compartirla.

## Manejador local de errores EG

Incluye [la guía del manejador](references/error-handling.md) y tres plantillas TypeScript extraídas de la biblioteca propia `mm-nestjs-shared` 3.5.8, para implementarlo dentro del backend sin instalar el paquete privado. Documenta el contrato HTTP real, descriptores en/es, validación, logs y registro global sin dependencia de monitoreo externo. El material extraído pertenece a la biblioteca del propietario de EG; la atribución MIT del documento NestJS original no asigna una licencia nueva a estos archivos.
