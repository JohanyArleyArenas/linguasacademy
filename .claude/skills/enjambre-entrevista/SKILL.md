---
name: enjambre-entrevista
description: Fase 6 de la simulación de enjambre. Permite hablar en primera persona con cualquier agente de una simulación ya corrida, o entrevistar a varios a la vez con la misma pregunta, respetando su persona, lo que hizo y lo que llegó a ver; guarda las respuestas en entrevistas.md para el informe. Úsala cuando el usuario diga "quiero hablar con @...", "entrevista a los estudiantes", "pregúntale al rector por qué..." o "¿qué piensa el agente X?".
argument-hint: "simulaciones/<slug> [@usuario o id] [pregunta]"
---

# Fase 6: entrevistar a los agentes

Motor: `python3 .claude/skills/enjambre/motor.py agente simulaciones/<slug> <id> --vistos`

## Entrevista individual

1. Identifica al agente por id, @usuario o nombre (búscalo en `personas.json`).
2. Ejecuta `agente <id> --vistos` para tener su persona, su memoria previa, todo lo que hizo, las respuestas que recibió y lo que llegó a ver en su feed.
3. Responde **como ese agente**, en primera persona, con su voz y su registro:
   - Solo sabe lo que está en esa salida y en su persona. Si le preguntan por algo que no vio, no lo sabe o lo conoce de oídas.
   - Su opinión **actual** es la que muestra su último comportamiento en la simulación, aunque haya cambiado respecto a la postura inicial. Puede explicar por qué cambió apoyándose en lo que vio.
   - Puede negarse, evadir o responder a la defensiva si eso encaja con su personaje. Una cuenta institucional contesta como lo haría su área de comunicaciones.
   - Respeta los límites de la simulación: no inventes hechos fuera de lo simulado ni atribuyas a personas reales cosas que no están en el material o la simulación.
4. Sigue en personaje mientras el usuario hable con ese agente. Sales del personaje si el usuario lo pide o cambia de tema, y lo señalas con una línea como `[fuera de personaje]`.

## Entrevista grupal

Cuando se pide la opinión de un grupo ("¿qué piensan los medios?"):

1. Elige de 3 a 6 agentes que representen las distintas posturas y tipos del grupo, no solo a los más ruidosos. Explica en una línea por qué elegiste a cada uno.
2. Consulta `agente <id> --vistos` de cada uno y contesta la misma pregunta por separado, cada uno con su propia voz.
3. Cierra con 2–3 líneas fuera de personaje: en qué coinciden, en qué se diferencian y alguna sorpresa.

## Registro

Añade cada entrevista al final de `simulaciones/<slug>/entrevistas.md`:

```markdown
## Ronda 18 · @laugomez_ (Laura Gómez, Student)
**Pregunta:** ...
**Respuesta:** ...
```

`enjambre-informe` cita desde aquí. Aclara siempre que las respuestas de una entrevista son interpretación posterior a la simulación y no publicaciones hechas durante ella.
