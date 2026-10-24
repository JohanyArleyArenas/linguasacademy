---
name: enjambre-mundo
description: Fase 1 de la simulación de enjambre. Lee el material semilla y construye mundo.json, es decir, la ontología (tipos de actores y de relaciones) y el grafo de actores reales con sus relaciones y citas textuales del material. Úsala desde la skill enjambre o cuando el usuario pida "extrae los actores", "arma el grafo del caso" o "quién participa en esta historia".
argument-hint: "simulaciones/<slug>"
---

# Fase 1: construir el mundo

Entrada: `simulaciones/<slug>/requisito.md` y el material de `semillas/`.
Salida: `simulaciones/<slug>/mundo.json`.

## 1. Leer el material completo

Lee todo el material semilla. Si es largo (más de unas 40 páginas), léelo por partes y ve tomando notas de actores y hechos; no te saltes partes. Para un PDF usa Read con `pages`. Guarda en `semillas/` una copia o el texto extraído para que las fases posteriores puedan citarlo.

## 2. Diseñar la ontología

Diseña tipos pensados para una **simulación de opinión pública en redes**. Cada entidad será una cuenta que publica, comenta y reacciona.

**Tipos de entidad, exactamente 10:**
- 8 tipos específicos sacados del material (p. ej. `Student`, `Professor`, `University`, `MediaOutlet`, `GovernmentAgency`, `Company`, `Influencer`, `Union`). Cada uno con un límite claro y sin solaparse.
- Los 2 últimos siempre son los tipos comodín: `Person` (cualquier persona que no encaje en un tipo específico) y `Organization` (cualquier organización que no encaje).
- Nombres en inglés y PascalCase; descripción en el idioma de la simulación (máximo 100 caracteres).
- De 1 a 3 atributos por tipo, en snake_case. Están **prohibidos** los nombres `name`, `uuid`, `group_id`, `graph_id`, `created_at` y `summary`. Usa `full_name`, `role`, `position`, `location`, etc.

**Pueden ser entidades:** personas concretas (figuras públicas, implicados, expertos, gente común), empresas, instituciones, organismos públicos, medios, plataformas y colectivos con voz (asociaciones de egresados, sindicatos, grupos de afectados).
**No pueden ser entidades:** conceptos ("la opinión"), temas ("la reforma educativa") ni posturas ("los que están en contra").

**Tipos de relación, entre 6 y 10:** en inglés y UPPER_SNAKE_CASE (p. ej. `WORKS_FOR`, `STUDIES_AT`, `REPORTS_ON`, `RESPONDS_TO`, `SUPPORTS`, `OPPOSES`, `REGULATES`, `COLLABORATES_WITH`, `COMPETES_WITH`, `REPRESENTS`), cada uno con sus pares `origen → destino` válidos.

## 3. Extraer actores y relaciones

- Una entidad por cada actor con nombre propio o rol claro que aparezca en el material y sea relevante para la pregunta de predicción.
- Si el escenario necesita voces que el material solo menciona en grupo ("los padres de familia", "los usuarios"), crea 1–3 representantes con tipo `Person` u `Organization`, marca `"sintetico": true` y deja claro en el resumen que son representativos, no personas reales.
- Respeta el tamaño acordado en `requisito.md`. Si hay demasiados actores, quédate con los más relevantes para la pregunta, sin descartar ninguna postura.
- Cada entidad lleva un `resumen` (2–4 frases sobre quién es y qué ha hecho en este caso) y `fuentes` con 1–3 citas **textuales** del material. Si una entidad sintética no tiene cita, deja `fuentes` vacío.
- Cada relación lleva un `hecho`: una frase que la justifique.

## 4. Escribir mundo.json

```json
{
  "requisito": "pregunta de predicción",
  "resumen_analisis": "3-6 frases: de qué trata el material y qué tensiones hay",
  "ontologia": {
    "tipos_entidad": [
      {"nombre": "Student", "descripcion": "...", "atributos": [{"nombre": "university", "descripcion": "..."}], "ejemplos": ["..."]}
    ],
    "tipos_relacion": [
      {"nombre": "STUDIES_AT", "descripcion": "...", "origen_destino": [{"origen": "Student", "destino": "University"}]}
    ]
  },
  "entidades": [
    {"id": "e1", "nombre": "Laura Gómez", "tipo": "Student", "resumen": "...", "atributos": {"university": "UNAL"}, "fuentes": ["cita textual"], "sintetico": false}
  ],
  "relaciones": [
    {"origen": "e1", "destino": "e2", "tipo": "STUDIES_AT", "hecho": "..."}
  ]
}
```

Comprueba que cada `tipo` de entidad exista en la ontología y que cada relación use ids existentes y un par origen→destino permitido. Termina mostrándole al usuario una tabla con los actores (nombre, tipo, una línea de resumen).
