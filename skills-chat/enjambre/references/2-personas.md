# Fase 2: generar las personas

Entrada: `simulaciones/<slug>/mundo.json` (y el material de `semillas/` para contexto).
Salida: `simulaciones/<slug>/personas.json`.

Genera un perfil por entidad. El objetivo es **reproducir lo más fielmente posible la realidad conocida**: todo lo que diga el material sobre el actor se respeta, y lo que inventes para completar el perfil tiene que ser coherente con eso. Antes de escribir, reúne para cada actor su resumen, sus atributos, sus relaciones en `mundo.json` y las citas del material.

## Individuos (Student, Professor, Person, Journalist…)

- `bio`: biografía de red social, unos 200 caracteres, con la voz del propio personaje.
- `persona`: un solo párrafo de 250–400 palabras, sin saltos de línea, que cubra:
  - datos básicos (edad, ocupación, formación, ciudad);
  - trayectoria y relación con el caso;
  - personalidad (MBTI, rasgos centrales, cómo expresa las emociones);
  - comportamiento en redes (cuánto publica, qué le gusta compartir, cómo interactúa, cómo escribe: registro, muletillas, emojis o no);
  - postura (qué piensa del tema, qué lo enfurece y qué lo conmueve);
  - rasgos únicos (expresiones, aficiones).
- `memoria`: 2–4 frases sobre qué ha hecho o dicho **ya** en este caso, antes de que empiece la simulación.
- `edad` (entero), `genero` (`"male"` o `"female"`), `mbti`, `pais`, `profesion`, `temas` (3–6 temas de interés).

## Instituciones y colectivos (University, MediaOutlet, GovernmentAgency, Organization…)

- `bio`: biografía oficial de unos 200 caracteres, profesional.
- `persona`: un párrafo de 250–400 palabras que cubra:
  - qué es la institución y cuál es su función;
  - para qué usa la cuenta y a qué público se dirige;
  - estilo (tono, fórmulas habituales, temas que evita);
  - cadencia y horario de publicación;
  - postura oficial y cómo maneja las polémicas;
  - a quién representa.
- `memoria`: lo que la institución ya hizo o comunicó en el caso.
- `edad`: 30, `genero`: `"other"`, `mbti`: el que describa el estilo de la cuenta (p. ej. ISTJ para una cuenta rigurosa y conservadora), `pais`, `profesion` (su función), `temas`.

## Reglas

- `usuario`: un nombre de usuario plausible, único, en minúsculas, sin espacios ni tildes (p. ej. `laugomez_`, `unal_oficial`).
- Las figuras públicas reales se interpretan según su postura pública documentada en el material, sin atribuirles delitos ni hechos que no estén ahí. Si el material no da su postura, pon `"postura_documentada": false` y que la persona refleje esa incertidumbre.
- Diversidad realista: no todos los estudiantes piensan igual ni todos los medios son neutrales. Si el material lo justifica, incluye voces moderadas, indecisas e indiferentes.
- Nada de caricaturas ni estereotipos ofensivos por género, etnia, religión, región o clase.

## personas.json

Es una lista con ids enteros consecutivos desde 0:

```json
[
  {
    "id": 0, "entidad_id": "e1", "nombre": "Laura Gómez", "usuario": "laugomez_",
    "tipo": "Student", "es_individuo": true,
    "bio": "...", "persona": "...", "memoria": "...",
    "edad": 21, "genero": "female", "mbti": "ENFP", "pais": "Colombia",
    "profesion": "Estudiante de Sociología", "temas": ["matrícula", "educación pública", "movilización"],
    "sintetico": false
  }
]
```

Al terminar, muéstrale al usuario una tabla compacta (id, nombre, @usuario, tipo, una línea de postura). Si quiere ajustar a alguien, edita solo ese perfil.
