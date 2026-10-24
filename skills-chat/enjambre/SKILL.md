---
name: enjambre
description: Motor de predicción por simulación de enjambre, inspirado en MiroFish. A partir de un material semilla (noticia, informe, borrador de política, novela) y una pregunta de predicción, construye un mundo de actores, les da personalidad, simula ronda a ronda cómo reaccionan en una red social (Twitter o Reddit) y escribe un informe de predicción con citas de los agentes; después permite entrevistar a cualquier agente o inyectar eventos tipo "¿y si...?". Úsala cuando el usuario diga "simula cómo reaccionaría la gente a...", "predice qué pasaría si...", "enjambre", "MiroFish", "simulación de opinión pública", "entrevista al agente...", o suba un .zip de una simulación anterior para continuarla.
---

# Enjambre: simulación de opinión pública para predecir escenarios

Tú (Claude) haces de modelo de lenguaje para todos los agentes. El script `scripts/motor.py` (solo usa la biblioteca estándar de Python 3) se encarga de lo mecánico y reproducible: el reloj, quién se conecta cada hora, qué ve cada uno en su feed, la cámara de eco, el registro y la búsqueda.

## Rutas

- **`<motor>`** = `scripts/motor.py` dentro de la carpeta de esta skill. Si no sabes la ruta absoluta, encuéntrala con `find / -name motor.py -path "*enjambre*" 2>/dev/null | head -1`.
- **Carpeta de trabajo:** `/home/claude`. Todas las rutas `simulaciones/<slug>` de las referencias son relativas a ella, así que ejecuta los comandos con `cd /home/claude && python3 <motor> ...`.
- **Archivos del usuario:** `/mnt/user-data/uploads/`. **Entregables:** `/mnt/user-data/outputs/`.

## Fases

Lee cada referencia **al llegar a su fase**, no todas al principio.

| Fase | Referencia | Produce |
|---|---|---|
| 1. Mundo | `references/1-mundo.md` | `mundo.json`: ontología, actores y relaciones |
| 2. Personas | `references/2-personas.md` | `personas.json`: perfil completo de cada agente |
| 3–4. Configurar y simular | `references/3-simular.md` | `config.json`, `estado.json`, `registro.jsonl`; inyectar eventos |
| 5. Informe | `references/4-informe.md` | `informe.md` con citas de los agentes |
| 6. Entrevistas | `references/5-entrevista.md` | conversar con agentes; `entrevistas.md` |

Si el usuario solo quiere una fase (p. ej. entrevistar a un agente de una simulación que ya subió), ve directo a esa referencia.

## Paso 0: entender el encargo

Antes de crear nada, asegúrate de tener:

1. **Material semilla**: archivos, texto pegado o un enlace. Si el usuario solo da un tema, ofrécele tres opciones: buscar fuentes reales en la web (que él aprueba), inventar un caso ficticio claramente marcado como tal, o que él aporte el material. Nunca inventes hechos presentándolos como reales.
2. **Requisito de predicción**: una frase que diga qué se quiere saber. Ej.: "¿Cómo reaccionarán estudiantes, profesores y medios si la universidad sube la matrícula un 12 %?". Si es vago, propón una versión concreta.
3. **Tamaño**: en el chat, por defecto **8–10 agentes y 8 rondas**. Para algo más detallado, hasta 15 agentes y 12 rondas. Más que eso llena el chat.
4. **Plataforma**: `twitter` (posts cortos, likes, reposts, citas) o `reddit` (posts y comentarios).
5. **Idioma**: el de la conversación.

Pregunta todo lo que falte **en un solo mensaje** y, en adelante, avanza sin pedir permiso en cada paso. Entre una fase y otra, muestra un resumen muy breve (p. ej. una tabla de actores con su tipo y postura).

## Paso 1: carpeta de la simulación

```
/home/claude/simulaciones/<slug>/
  requisito.md      # pregunta, tamaño, plataforma, idioma, fecha, si el caso es ficticio
  semillas/         # texto del material semilla
  mundo.json, personas.json, config.json
  estado.json, registro.jsonl, acciones/   # los escribe el motor
  informe.md, entrevistas.md
```

## Comandos del motor

`validar`, `iniciar`, `ronda`, `aplicar <acciones.json>`, `inyectar --texto ...`, `estado`, `buscar "<consulta>" [--agente N] [--rondas A-B]`, `panorama`, `agente <id> [--vistos]`. Las referencias explican cuándo usar cada uno.

Para leer los turnos sin gastar contexto, usa una vista compacta en lugar del JSON completo:

```bash
cd /home/claude && python3 <motor> ronda simulaciones/<slug> > /dev/null && python3 -c "
import json;t=json.load(open('simulaciones/<slug>/turno.json'));print(t['hora_simulada'],'ronda',t['ronda'],t['eventos_nuevos'])
for a in t['agentes']:
  print('\n##',a['agente_id'],a['usuario'],a['postura'],'| notif:',a['notificaciones'])
  for x in a['lo_que_ha_publicado']: print('  [propio]',x[:140])
  for f in a['feed']: print('  ',f['post_id'],f['autor'],f['tipo'],'❤',f['likes'],'⟳',f['reposts'],'YA' if f.get('ya_reaccionaste') else '','|',f['contenido'][:170])"
```

## Guardar y retomar (el chat no conserva archivos entre conversaciones)

- **Al terminar cada fase grande** (después de las personas, de la simulación y del informe), empaqueta la carpeta y entrégala: `cd /home/claude/simulaciones && zip -qr /mnt/user-data/outputs/<slug>.zip <slug>`. Avísale al usuario en una línea que puede descargarla para continuar otro día.
- **Para retomar:** si el usuario sube `<slug>.zip`, descomprímelo en `/home/claude/simulaciones/`, ejecuta `estado` y sigue desde donde quedó (más rondas, inyectar un evento, el informe o las entrevistas).
- Entrega siempre `informe.md` en `/mnt/user-data/outputs/`.

## Principios

- **Los agentes son actores que pueden opinar en redes**: personas, empresas, instituciones, medios, colectivos. Nunca conceptos abstractos.
- **La simulación es la predicción**: el informe solo puede afirmar lo que pasó en la simulación y debe citar a los agentes. Nada de rellenar con conocimiento propio.
- **Vista de Dios**: el usuario puede inyectar eventos a mitad de la simulación y comparar el resultado con el de una copia sin inyectar.
- **Honestidad**: es un ensayo plausible, no un oráculo. Di siempre qué tan robusto es cada hallazgo y qué agentes no llegaron a participar.
- **Personas reales**: interprétalas según su postura documentada, sin atribuirles hechos que no estén en el material. Ninguna simulación se usa para fabricar declaraciones que puedan pasar por reales.
