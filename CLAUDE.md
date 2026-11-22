@AGENTS.md

# Skills y plugins de este proyecto

Lingua's Academy tiene instaladas skills en `.claude/skills/` y plugins en
`.claude/settings.json`. Úsalas sin que te las pidan, según el tipo de tarea.
Si dos se solapan, manda el orden de abajo.

## Qué usar en cada tarea

| Tarea | Skills, en este orden |
| --- | --- |
| Funcionalidad nueva o cambio de comportamiento | `brainstorming` → `writing-plans` → `executing-plans` (o `subagent-driven-development` si las tareas son independientes) |
| Cualquier cosa que el usuario final vea (páginas, componentes, textos) | Las fases de `ui-consistency` se suman al proceso anterior: `finding-patterns` antes del primer cambio visible, `verifying` al terminar |
| Cambio pequeño en una sola página | `ui-consistency:adjusting` → `implementing` → `verifying` |
| Bug, error o comportamiento inesperado | `systematic-debugging` antes de proponer un arreglo |
| Lógica nueva o arreglo de un bug | `test-driven-development` cuando haya forma de probarlo (ver "Verificación") |
| Comparar con Preply/italki o buscar huecos de producto | `replica-recon`, `replica-diff`, `replica-entrepreneur` |
| Antes de decir que algo está terminado | `verification-before-completion`, luego `requesting-code-review` |
| Al cerrar una rama | `finishing-a-development-branch` |

Las skills `replica-*` sirven para estudiar qué hacen otras plataformas
(funciones y flujos) y mejorar la nuestra. Lingua's Academy conserva su propio
nombre, marca, colores y textos: nunca copies el código, el diseño, el logo ni
el contenido de Preply, italki u otra plataforma.

## Plugins que se invocan a mano

- **octo** (`/octo:...`): orquestación con varios modelos. Solo cuando el
  usuario pida un comando `/octo:` concreto. En una sesión nueva puede hacer
  falta `/octo:setup` primero.
- **i-have-adhd** (`/i-have-adhd`): da formato a las respuestas para un lector
  con TDAH. Se activa con `/i-have-adhd` y se desactiva con "stop adhd mode".

## Verificación

El proyecto no tiene todavía tests automáticos. Antes de dar algo por
terminado, ejecuta y muestra el resultado de:

```bash
npx next typegen && npx tsc --noEmit
npm run lint
```

`npm run build` ejecuta `prisma migrate deploy` y necesita una base de datos;
no lo uses como comprobación si no hay `DATABASE_URL`. Para comprobar una
página, levanta `npm run dev` y ábrela con Playwright.
