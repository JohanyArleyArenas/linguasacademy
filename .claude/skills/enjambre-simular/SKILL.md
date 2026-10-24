---
name: enjambre-simular
description: Fases 3 y 4 de la simulación de enjambre. Genera config.json (horario, eventos iniciales y programados, actividad, postura e influencia de cada agente) y ejecuta la simulación ronda a ronda con el motor, interpretando a cada agente activo según su persona y lo que ve en su feed. También sirve para inyectar eventos a mitad de la simulación ("vista de Dios"). Úsala desde la skill enjambre, o cuando el usuario diga "corre la simulación", "sigue simulando", "avanza N rondas" o "inyecta este evento".
argument-hint: "simulaciones/<slug> [n_rondas | inyectar \"evento\"]"
---

# Fases 3–4: configurar y correr la simulación

Motor: `python3 <skills>/enjambre/motor.py <comando> simulaciones/<slug>`

> `<skills>` es la carpeta que contiene las skills `enjambre*`: el directorio padre del "Base directory" que se muestra al cargar esta skill (por ejemplo `.claude/skills` en un proyecto o `~/.claude/skills` si están instaladas para tu usuario).


Si ya existe `estado.json`, sáltate la parte A: la simulación está en curso. Usa `estado` para ver en qué ronda va y continúa en la parte B.

## A. Generar config.json

Basándote en `requisito.md`, `mundo.json` y `personas.json`:

### tiempo
Deduce la zona horaria y los hábitos del público. Por defecto, Colombia (UTC-5): madrugada casi muerta, mañana tranquila, jornada laboral media y pico de 19 a 22 h. Ajusta según el caso: los estudiantes tienen el pico entre 21 y 23 h, los medios publican todo el día, las instituciones solo en horario laboral y una noticia de última hora acorta la madrugada.

```json
"tiempo": {
  "horas_totales": 36, "minutos_por_ronda": 120, "hora_inicio": 8,
  "agentes_por_hora_min": 2, "agentes_por_hora_max": 8,
  "horas_pico": [19, 20, 21, 22], "horas_valle": [0, 1, 2, 3, 4, 5],
  "horas_manana": [6, 7, 8], "horas_trabajo": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  "multiplicadores": {"pico": 1.5, "valle": 0.05, "manana": 0.4, "trabajo": 0.7, "otras": 0.5},
  "zona_horaria": "America/Bogota", "razonamiento": "..."
}
```
`rondas = horas_totales × 60 / minutos_por_ronda`; respeta el tamaño acordado. Los valores de agentes por hora se escalan solos a la duración de la ronda y nunca deben superar el 90 % del total de agentes.

### plataforma
```json
"plataforma": {"tipo": "twitter", "peso_recencia": 0.4, "peso_popularidad": 0.3, "peso_relevancia": 0.3,
               "umbral_viral": 10, "camara_eco": 0.5, "tamano_feed": 6}
```
Para Reddit usa `umbral_viral` 15 y `camara_eco` 0.6. El umbral viral es la interacción a partir de la cual un post rompe la cámara de eco; con pocos agentes, bájalo a 4–6.

### evento
- `temas_calientes`: de 5 a 10 palabras clave.
- `direccion_narrativa`: hacia dónde es razonable que evolucione la conversación. Es una hipótesis para el informe, **no un guion**.
- `publicaciones_iniciales`: de 2 a 5 posts que disparan la conversación, cada uno publicado por el agente que corresponda según su tipo (los comunicados oficiales los publica la institución, las noticias un medio, las opiniones estudiantiles un estudiante): `{"autor_id": 3, "contenido": "...", "temas": [...], "sentimiento": -0.2}`. Usa `autor_id: -1` para una fuente externa sin cuenta en la simulación.
- `eventos_programados`: opcional, lo que se sabe que pasará: `{"ronda": 6, "contenido": "...", "autor_id": -1}`.

### agentes (uno por persona)
Valores de referencia según el tipo, ajustados al caso:

| Tipo | nivel_actividad | horas_activas | peso_influencia |
|---|---|---|---|
| Institución u organismo oficial | 0.1–0.3 | 9–17 | 2.5–3.0 |
| Medio | 0.4–0.6 | 7–23 | 2.0–2.5 |
| Experto o figura pública | 0.4–0.6 | 8–21 | 1.5–2.0 |
| Individuo (estudiante, ciudadano) | 0.6–0.9 | mañana + 18–23 | 0.8–1.2 |

```json
{"agente_id": 0, "nivel_actividad": 0.8, "horas_activas": [8, 9, 12, 13, 18, 19, 20, 21, 22, 23],
 "sesgo_sentimiento": -0.3, "postura": "en_contra", "peso_influencia": 1.0}
```
`postura` es una de `a_favor`, `en_contra`, `neutral` u `observador` (respecto a la pregunta de predicción). `sesgo_sentimiento` va de -1 a 1.

Añade `"semilla": 42`. Después ejecuta `validar` y corrige lo que señale. Muestra al usuario una línea por agente (postura, actividad, influencia) y luego ejecuta `iniciar`.

## B. Correr las rondas

Lee `personas.json` **una sola vez** al empezar, para tener presentes las personas completas. Después repite:

1. `python3 <skills>/enjambre/motor.py ronda simulaciones/<slug>`: imprime el turno (también queda en `turno.json`) con la hora simulada, los eventos nuevos y, por cada agente activo, su feed, sus notificaciones y lo último que publicó.
2. Interpreta a **cada** agente activo y escribe sus acciones en `simulaciones/<slug>/acciones/ronda-N.json`:
   ```json
   [
     {"agente_id": 4, "accion": "CREAR_POST", "contenido": "...", "temas": ["matrícula"], "sentimiento": -0.6, "razon": "..."},
     {"agente_id": 4, "accion": "LIKE", "post_id": "p7"},
     {"agente_id": 9, "accion": "CITAR", "post_id": "p3", "contenido": "...", "sentimiento": 0.2},
     {"agente_id": 2, "accion": "NADA"}
   ]
   ```
   - Twitter: `CREAR_POST`, `LIKE`, `REPOST`, `CITAR` (post_id + contenido), `SEGUIR` (objetivo_id), `NADA`.
   - Reddit: `CREAR_POST`, `COMENTAR` (post_id + contenido), `LIKE`, `DISLIKE`, `SEGUIR`, `SILENCIAR`, `NADA`.
   - Cada agente activo necesita al menos una acción (puede ser `NADA`) y como máximo 3.
   - `razon` es opcional: una nota interna breve, útil para el informe.
3. `python3 <skills>/enjambre/motor.py aplicar simulaciones/<slug> simulaciones/<slug>/acciones/ronda-N.json`. Si da PROBLEMA, no se aplicó nada: corrige el archivo y vuelve a aplicarlo.

Avanza las rondas que pidió el usuario (todas, por defecto) sin pedir permiso entre una y otra. Cada 4–6 rondas, cuéntale en una línea qué está pasando (p. ej. "ronda 8/18: el comunicado del rector se volvió viral en contra; los medios empiezan a citar a los estudiantes"). Cuando termine, ejecuta `panorama` y pasa a `enjambre-informe`.

### Cómo interpretar bien a los agentes

Esta es la parte que decide la calidad de la predicción.

- **Solo saben lo que ven**: su persona, su memoria, lo que ya publicaron, sus notificaciones y su feed de esta ronda. No conocen posts que no les aparecieron ni lo que tú sabes del resto de la simulación.
- **Coherencia con la persona**: el registro, la longitud, la ortografía, los emojis y las muletillas tienen que ser los suyos. Una cuenta institucional escribe comunicados; una estudiante de 20 años, no. En Twitter, como máximo 280 caracteres.
- **La mayoría reacciona; pocos publican**: en una ronda típica predominan los `LIKE` y `REPOST` y los `NADA`. Crear posts es menos frecuente, salvo en agentes muy activos o ante algo que les toca de cerca.
- **Opiniones con inercia, pero no fijas**: la postura y el sesgo de la configuración son el punto de partida. Un agente puede moderarse, radicalizarse o cambiar de opinión si su feed le da razones de verdad; cuando pase, déjalo explicado en `razon`. Ese movimiento es justamente lo que mide la simulación.
- **No dirijas el resultado**: la `direccion_narrativa` es una hipótesis. No empujes a los agentes hacia ella ni hacia lo que creas que el usuario quiere oír.
- **Interacción real**: responde a posts concretos del feed por su `post_id`, menciona a otros por @usuario y sigue los hilos. Evita que todos publiquen monólogos paralelos.
- **Variedad**: no repitas frases ni argumentos entre agentes. Si dos piensan parecido, que lo digan con palabras distintas y desde motivos distintos.
- **Sentimiento**: anota `sentimiento` (-1 a 1) en cada post, comentario o cita, según el tono real del texto.
- **Límites**: nada de acoso dirigido, amenazas creíbles ni datos personales reales. Si el escenario incluye conflicto, se representa sin reproducir insultos graves al pie de la letra.

### Si la simulación es grande

Para no gastar contexto: no vuelvas a leer `personas.json` cada ronda (el turno ya trae la bio y lo reciente). Si una ronda tiene muchos agentes, escribe el archivo de acciones por partes con un script corto que vaya sumando listas. Si el contexto empieza a llenarse, las rondas ya aplicadas están en `estado.json` y `registro.jsonl`, así que puedes retomar en otra conversación con `/enjambre-simular simulaciones/<slug>`.

## C. Inyectar eventos ("vista de Dios")

Cuando el usuario quiera probar un "¿y si…?" a mitad de la simulación:

```bash
python3 <skills>/enjambre/motor.py inyectar simulaciones/<slug> --texto "El ministerio congela el aumento" --temas "matrícula,ministerio"
# o que lo publique un agente concreto:
python3 <skills>/enjambre/motor.py inyectar simulaciones/<slug> --autor 3 --texto "..."
```

Para comparar escenarios, copia primero la carpeta (`cp -r simulaciones/<slug> simulaciones/<slug>-variante`) e inyecta el evento solo en la copia. Así quedan dos futuros comparables con la misma semilla.
