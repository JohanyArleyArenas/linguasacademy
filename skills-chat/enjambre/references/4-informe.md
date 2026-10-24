# Fase 5: informe de predicción

Motor: `python3 <motor> <comando> simulaciones/<slug>`



Escribes con **vista de Dios** sobre un ensayo del futuro. La simulación es la predicción: lo que hicieron los agentes es lo que el informe dice que harían esos grupos en la realidad bajo las condiciones planteadas.

## Reglas que no se rompen

1. **Todo sale de la simulación.** Cada afirmación se apoya en lo que devuelven las herramientas del motor. No uses tu conocimiento del mundo para completar huecos.
2. **Citas textuales.** Copia las citas de los agentes tal como aparecen, con autor y post_id: `> "texto" — @usuario (p12, ronda 5)`. Si el contenido está en otro idioma, tradúcelo e indícalo.
3. **Nada inventado.** Ni usuarios, ni citas, ni cifras, ni porcentajes que no se puedan calcular con los datos. Si falta información sobre algo, dilo.
4. **Calibra la confianza.** Explica qué tan robusto es cada hallazgo: si lo sostienen muchos agentes y muchas rondas, o si depende de un solo agente o de un evento inyectado. La simulación usa pocos agentes y un modelo de lenguaje; es un ensayo plausible, no una estadística.

## Herramientas de consulta

| Herramienta | Comando | Para qué |
|---|---|---|
| Panorama | `panorama [-n 10]` | Evolución por rondas, sentimiento, participación por postura, agentes más influyentes, posts top y eventos |
| Búsqueda | `buscar "consulta" [--agente N] [--rondas A-B] [-n 15]` | Encontrar posts concretos sobre un tema, de un agente o de una fase |
| Agente | `agente N [--vistos]` | Todo lo que hizo un agente, quién le respondió y qué llegó a ver |
| Entrevistas | `entrevistas.md` | Respuestas en primera persona de los agentes (de `references/5-entrevista.md`) |

## Proceso

1. **Contexto.** Lee `requisito.md`, el `resumen_analisis` de `mundo.json` y la `direccion_narrativa` de `config.json`, y ejecuta `panorama`.
2. **Esquema.** Diseña de 2 a 5 secciones (sin subsecciones) con título, subtítulo de una línea que resuma la predicción central y una descripción breve de cada sección. Elige las secciones según lo que pasó; por ejemplo: cómo se desarrolló el evento, cómo reaccionó cada grupo, puntos de quiebre, fenómenos emergentes (viralización, cámaras de eco, cambios de postura), riesgos y oportunidades.
3. **Investigación por sección.** Antes de escribir cada sección, haz **entre 3 y 5 consultas** combinando herramientas distintas (no solo `buscar`). Si la sección trata de cómo vio algo un grupo concreto y no hay entrevistas, puedes usar `references/5-entrevista.md` para entrevistar a 2–4 agentes representativos.
4. **Redacción.** Escribe cada sección sin repetir lo que dijeron las anteriores. En el cuerpo de la sección usa **negritas**, listas y citas en bloque separadas por líneas en blanco; no uses subencabezados.
5. **Cierre.** Termina con:
   - **Predicción en una frase**: la respuesta directa a la pregunta de `requisito.md`.
   - **Señales a vigilar**: 3–5 indicadores observables en la vida real que confirmarían o desmentirían la predicción.
   - **Límites de esta simulación**: número de agentes, rondas, plataforma, actores sintéticos, eventos inyectados y dependencias de pocos agentes.

## informe.md

```markdown
# <Título>
_<Subtítulo: la predicción central en una frase>_

**Pregunta:** ... · **Simulación:** N agentes, R rondas (X h simuladas) en <plataforma> · **Fecha:** ...

## 1. <Sección>
...

## Predicción en una frase
## Señales a vigilar
## Límites de esta simulación
```

Guárdalo en `simulaciones/<slug>/informe.md` y, en el chat, resume en 3–5 viñetas lo principal. Copia `informe.md` a `/mnt/user-data/outputs/` para que el usuario pueda descargarlo, y ofrécele también un documento Word o PDF si le sirve.

## Preguntas sobre el resultado

Si el usuario pregunta algo sobre una simulación que ya tiene informe, responde primero con el informe. Si no alcanza, haz como mucho 1–2 consultas al motor. Da primero la conclusión y después el porqué, con alguna cita en bloque. Sé breve.
