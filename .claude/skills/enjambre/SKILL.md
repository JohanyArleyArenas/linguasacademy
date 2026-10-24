---
name: enjambre
description: Motor de predicción por simulación de enjambre (inspirado en MiroFish). A partir de un material semilla (noticia, informe, borrador de política, novela) y una pregunta de predicción, construye un mundo de actores, les da personalidad, simula cómo reaccionan en una red social ronda a ronda y escribe un informe de predicción. Úsala cuando el usuario diga "simula cómo reaccionaría la gente a...", "predice qué pasaría si...", "enjambre", "MiroFish", "simulación de opinión pública" o quiera ensayar una decisión antes de tomarla.
argument-hint: "[pregunta de predicción o ruta del material semilla]"
---

# Enjambre: simulación de opinión pública para predecir escenarios

Esta skill es el **orquestador**. Recorre las cinco fases en orden, delegando cada una a su skill. Tú (Claude) haces de modelo de lenguaje para todos los agentes; el motor `motor.py` se encarga de lo mecánico y reproducible (reloj, quién se conecta cada hora, qué ve cada uno en su feed, cámara de eco, registro y búsqueda). No hace falta ninguna API key ni Zep.

| Fase | Skill | Produce |
|---|---|---|
| 1. Mundo | `enjambre-mundo` | `mundo.json`: ontología, actores y relaciones extraídos del material |
| 2. Personas | `enjambre-personas` | `personas.json`: perfil de red social completo por actor |
| 3–4. Configurar y simular | `enjambre-simular` | `config.json`, `estado.json`, `registro.jsonl` |
| 5. Informe | `enjambre-informe` | `informe.md` con citas de los agentes |
| 6. Interacción | `enjambre-entrevista` | `entrevistas.md`; charlar con cualquier agente |

## Paso 0: entender el encargo

Antes de crear nada, asegúrate de tener:

1. **Material semilla**: archivos (PDF, DOCX, TXT, MD), texto pegado o un enlace. Si no hay material, pídelo. Si el usuario solo da un tema, ofrece buscar fuentes reales en la web y que él las apruebe; no inventes los hechos de partida.
2. **Requisito de predicción**: una frase que diga qué se quiere saber. Ej.: "¿Cómo reaccionarán estudiantes, profesores y medios si la universidad sube la matrícula un 12 %?". Si es vago, propón una versión concreta y confírmala.
3. **Tamaño**: por defecto 12–20 agentes y 12–18 rondas. Cada ronda la interpretas tú, así que más agentes y rondas = más tiempo y más contexto. Para algo rápido: 8 agentes, 8 rondas.
4. **Plataforma**: `twitter` (posts cortos, likes, reposts, citas) o `reddit` (posts y hilos de comentarios). Si no lo dicen, elige según el público del escenario y explícalo en una línea.
5. **Idioma**: el de la conversación (normalmente español) para todo el contenido.

## Paso 1: carpeta de la simulación

Crea `simulaciones/<slug-corto>/` en la raíz del proyecto, con:

```
simulaciones/<slug>/
  requisito.md      # pregunta de predicción, tamaño, plataforma, idioma, fecha
  semillas/         # copia o texto extraído del material semilla
  mundo.json        # fase 1
  personas.json     # fase 2
  config.json       # fase 3
  estado.json, registro.jsonl, acciones/   # fase 4 (los escribe el motor)
  informe.md, entrevistas.md               # fases 5 y 6
```

## Paso 2: ejecutar las fases

Invoca cada skill en orden con la ruta de la carpeta como argumento. Entre fases, enséñale al usuario un resumen muy breve (p. ej. la lista de actores con su tipo y postura) y sigue salvo que pida cambios. No pidas permiso en cada paso si ya aprobó el plan.

## El motor

```bash
python3 <skills>/enjambre/motor.py <comando> simulaciones/<slug> [opciones]
```

> `<skills>` es la carpeta que contiene las skills `enjambre*`: el directorio padre del "Base directory" que se muestra al cargar esta skill (por ejemplo `.claude/skills` en un proyecto o `~/.claude/skills` si están instaladas para tu usuario).


Comandos: `validar`, `iniciar`, `ronda`, `aplicar <acciones.json>`, `inyectar --texto ...`, `estado`, `buscar "<consulta>" [--agente N] [--rondas A-B]`, `panorama`, `agente <id> [--vistos]`. Solo usa la biblioteca estándar de Python 3. Las skills de cada fase explican cuándo usar cada comando.

## Principios (heredados de MiroFish)

- **Los agentes son actores que pueden opinar en redes**: personas, empresas, instituciones, medios, colectivos. Nunca conceptos abstractos ("la opinión pública", "la inflación").
- **La simulación es la predicción**: el informe solo puede afirmar lo que pasó en la simulación, y debe citar a los agentes. Nada de rellenar con conocimiento propio.
- **Vista de Dios**: el usuario puede inyectar eventos a mitad de la simulación ("¿y si el rector renuncia en la ronda 6?") y comparar resultados.
- **Honestidad**: es un ensayo plausible, no un oráculo. El informe debe decir qué tan robusto es cada hallazgo (cuántos agentes, cuántas rondas, si depende de un solo actor).
