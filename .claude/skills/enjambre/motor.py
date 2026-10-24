#!/usr/bin/env python3
"""
Motor de simulación de enjambre (inspirado en el flujo de MiroFish / OASIS).

El motor NO llama a ningún modelo: se encarga de la parte mecánica y
reproducible de la simulación (reloj, activación de agentes, feeds,
recomendación, cámara de eco, registro y búsqueda). Claude interpreta a
cada agente activado y devuelve sus acciones en un archivo JSON.

Uso (desde la raíz del repo):
    python3 <skills>/enjambre/motor.py <comando> <carpeta_sim> [opciones]

Comandos:
    validar     Revisa mundo.json, personas.json y config.json
    iniciar     Crea estado.json y publica las publicaciones iniciales
    ronda       Prepara la siguiente ronda (agentes activos + su feed)
    aplicar     Aplica el archivo de acciones de la ronda pendiente
    inyectar    Inyecta un evento externo ("vista de Dios")
    estado      Muestra el progreso de la simulación
    buscar      Busca en todo lo publicado (texto, agente, rondas)
    panorama    Resumen global: evolución, posturas, publicaciones top
    agente      Historial completo de un agente (para entrevistas)
"""

import argparse
import json
import math
import os
import random
import re
import sys
import unicodedata
from collections import Counter, defaultdict

ACCIONES = {
    "twitter": ["CREAR_POST", "LIKE", "REPOST", "CITAR", "SEGUIR", "NADA"],
    "reddit": ["CREAR_POST", "COMENTAR", "LIKE", "DISLIKE", "SEGUIR", "SILENCIAR", "NADA"],
}
POSTURAS = ["a_favor", "en_contra", "neutral", "observador"]
MAX_ACCIONES_POR_AGENTE = 3
AUTOR_EXTERNO = -1


# ───────────────────────── utilidades ─────────────────────────

def fallar(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def leer_json(ruta, obligatorio=True):
    if not os.path.exists(ruta):
        if obligatorio:
            fallar(f"no existe {ruta}")
        return None
    with open(ruta, encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as e:
            fallar(f"{ruta} no es JSON válido: {e}")


def escribir_json(ruta, datos):
    tmp = ruta + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    os.replace(tmp, ruta)


def registrar(carpeta, evento):
    with open(os.path.join(carpeta, "registro.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(evento, ensure_ascii=False) + "\n")


def normalizar(texto):
    texto = unicodedata.normalize("NFKD", str(texto).lower())
    return "".join(c for c in texto if not unicodedata.combining(c))


def palabras(texto):
    return [w for w in re.findall(r"[a-z0-9ñ]+", normalizar(texto)) if len(w) > 2]


def cargar(carpeta):
    personas = leer_json(os.path.join(carpeta, "personas.json"))
    config = leer_json(os.path.join(carpeta, "config.json"))
    estado = leer_json(os.path.join(carpeta, "estado.json"), obligatorio=False)
    return personas, config, estado


def indice_personas(personas):
    return {int(p["id"]): p for p in personas}


def indice_cfg_agentes(config):
    return {int(a["agente_id"]): a for a in config.get("agentes", [])}


def total_rondas(config):
    t = config["tiempo"]
    return max(1, int(t["horas_totales"] * 60 // t["minutos_por_ronda"]))


def hora_de_ronda(config, ronda):
    t = config["tiempo"]
    minutos = t.get("hora_inicio", 8) * 60 + max(ronda - 1, 0) * t["minutos_por_ronda"]
    dia = minutos // (24 * 60) + 1
    hora = (minutos // 60) % 24
    minuto = minutos % 60
    return dia, hora, minuto


def etiqueta_hora(config, ronda):
    dia, hora, minuto = hora_de_ronda(config, ronda)
    return f"Día {dia}, {hora:02d}:{minuto:02d}"


def multiplicador_hora(config, hora):
    t = config["tiempo"]
    m = t.get("multiplicadores", {})
    if hora in t.get("horas_pico", []):
        return m.get("pico", 1.5)
    if hora in t.get("horas_valle", []):
        return m.get("valle", 0.05)
    if hora in t.get("horas_manana", []):
        return m.get("manana", 0.4)
    if hora in t.get("horas_trabajo", []):
        return m.get("trabajo", 0.7)
    return m.get("otras", 0.5)


def nombre_autor(pidx, autor_id):
    if autor_id == AUTOR_EXTERNO:
        return "Fuente externa", "fuente_externa"
    p = pidx.get(autor_id, {})
    return p.get("nombre", f"agente {autor_id}"), p.get("usuario", f"agente{autor_id}")


def similitud_postura(a, b):
    if a == b and a in ("a_favor", "en_contra"):
        return 1.0
    if {a, b} == {"a_favor", "en_contra"}:
        return -1.0
    return 0.0


def interaccion(post):
    return (len(post["likes"]) + 2 * len(post["reposts"]) + len(post["comentarios"])
            + len(post.get("citas", [])) - len(post["dislikes"]))


def nuevo_post(estado, autor_id, ronda, tipo, contenido, padre_id=None, temas=None, sentimiento=0.0):
    estado["contador_posts"] += 1
    pid = f"p{estado['contador_posts']}"
    estado["posts"][pid] = {
        "id": pid, "autor_id": autor_id, "ronda": ronda, "tipo": tipo,
        "contenido": contenido, "padre_id": padre_id, "temas": temas or [],
        "sentimiento": float(sentimiento or 0.0),
        "likes": [], "dislikes": [], "reposts": [], "comentarios": [], "citas": [],
    }
    if padre_id and padre_id in estado["posts"]:
        if tipo == "comentario":
            estado["posts"][padre_id]["comentarios"].append(pid)
        elif tipo == "cita":
            estado["posts"][padre_id]["citas"].append(pid)
    return pid


def notificar(estado, destinatario, texto):
    if destinatario is None or destinatario == AUTOR_EXTERNO:
        return
    estado["notificaciones"].setdefault(str(destinatario), []).append(texto)


# ───────────────────────── validar ─────────────────────────

def cmd_validar(args):
    c = args.carpeta
    problemas, avisos = [], []
    mundo = leer_json(os.path.join(c, "mundo.json"), obligatorio=False)
    if mundo is None:
        avisos.append("no hay mundo.json (opcional, pero recomendado)")
    else:
        ids = {e["id"] for e in mundo.get("entidades", [])}
        for r in mundo.get("relaciones", []):
            if r.get("origen") not in ids or r.get("destino") not in ids:
                problemas.append(f"relación con entidad inexistente: {r}")
    personas = leer_json(os.path.join(c, "personas.json"))
    config = leer_json(os.path.join(c, "config.json"))
    pids = set()
    usuarios = set()
    for p in personas:
        for campo in ("id", "nombre", "usuario", "bio", "persona"):
            if campo not in p:
                problemas.append(f"persona sin '{campo}': {p.get('nombre', p)}")
        if p.get("id") in pids:
            problemas.append(f"id de persona repetido: {p.get('id')}")
        if p.get("usuario") in usuarios:
            problemas.append(f"usuario repetido: {p.get('usuario')}")
        pids.add(p.get("id"))
        usuarios.add(p.get("usuario"))
    for clave in ("tiempo", "plataforma", "evento", "agentes"):
        if clave not in config:
            problemas.append(f"config.json sin '{clave}'")
    if not problemas:
        plat = config["plataforma"].get("tipo")
        if plat not in ACCIONES:
            problemas.append(f"plataforma.tipo debe ser twitter o reddit (es {plat})")
        for k in ("horas_totales", "minutos_por_ronda", "agentes_por_hora_min", "agentes_por_hora_max"):
            if k not in config["tiempo"]:
                problemas.append(f"tiempo sin '{k}'")
        cfg_ids = set()
        for a in config["agentes"]:
            aid = a.get("agente_id")
            cfg_ids.add(aid)
            if aid not in pids:
                problemas.append(f"config de agente {aid} sin persona")
            if a.get("postura") not in POSTURAS:
                problemas.append(f"agente {aid}: postura debe ser una de {POSTURAS}")
            if not 0 <= float(a.get("nivel_actividad", 0.5)) <= 1:
                problemas.append(f"agente {aid}: nivel_actividad fuera de 0-1")
        for pid in pids - cfg_ids:
            problemas.append(f"persona {pid} sin config de agente")
        for post in config["evento"].get("publicaciones_iniciales", []):
            if post.get("autor_id") not in pids and post.get("autor_id") != AUTOR_EXTERNO:
                problemas.append(f"publicación inicial con autor inexistente: {post.get('autor_id')}")
        for ev in config["evento"].get("eventos_programados", []):
            if "ronda" not in ev or "contenido" not in ev:
                problemas.append(f"evento programado incompleto: {ev}")
    for a in avisos:
        print(f"AVISO: {a}")
    if problemas:
        for p in problemas:
            print(f"PROBLEMA: {p}")
        sys.exit(1)
    print(f"OK: {len(personas)} agentes, {total_rondas(config)} rondas "
          f"de {config['tiempo']['minutos_por_ronda']} min en {config['plataforma']['tipo']}.")


# ───────────────────────── iniciar ─────────────────────────

def cmd_iniciar(args):
    c = args.carpeta
    personas, config, estado = cargar(c)
    if estado is not None and not args.forzar:
        fallar("ya existe estado.json; usa --forzar para reiniciar la simulación")
    for nombre in ("registro.jsonl",):
        ruta = os.path.join(c, nombre)
        if os.path.exists(ruta):
            os.remove(ruta)
    estado = {
        "ronda": 0,
        "total_rondas": total_rondas(config),
        "contador_posts": 0,
        "posts": {},
        "seguidores": {},      # agente -> [a quién sigue]
        "silenciados": {},     # agente -> [a quién silencia]
        "notificaciones": {},  # agente -> [textos pendientes]
        "pendiente": None,
        "eventos_aplicados": [],
    }
    for post in config["evento"].get("publicaciones_iniciales", []):
        pid = nuevo_post(estado, int(post["autor_id"]), 0, "post", post["contenido"],
                         temas=post.get("temas"), sentimiento=post.get("sentimiento", 0.0))
        registrar(c, {"ronda": 0, "tipo": "publicacion_inicial", "agente_id": int(post["autor_id"]),
                      "post_id": pid, "contenido": post["contenido"]})
    escribir_json(os.path.join(c, "estado.json"), estado)
    print(f"Simulación iniciada: {estado['total_rondas']} rondas, "
          f"{len(estado['posts'])} publicaciones iniciales.")


# ───────────────────────── ronda ─────────────────────────

def activar_agentes(config, personas, ronda, rng):
    t = config["tiempo"]
    cfg = indice_cfg_agentes(config)
    _, hora, _ = hora_de_ronda(config, ronda)
    mult = multiplicador_hora(config, hora)
    escala = t["minutos_por_ronda"] / 60.0
    minimo = max(1, round(t["agentes_por_hora_min"] * escala))
    maximo = max(minimo, round(t["agentes_por_hora_max"] * escala))
    prob = {}
    for p in personas:
        a = cfg[int(p["id"])]
        en_horario = hora in a.get("horas_activas", list(range(24)))
        prob[int(p["id"])] = min(1.0, float(a.get("nivel_actividad", 0.5)) * mult * (1.0 if en_horario else 0.1))
    activos = [aid for aid, pr in prob.items() if rng.random() < pr]
    if len(activos) < minimo:
        resto = sorted((aid for aid in prob if aid not in activos),
                       key=lambda aid: prob[aid] * rng.random(), reverse=True)
        activos += resto[: minimo - len(activos)]
    if len(activos) > maximo:
        activos = sorted(activos, key=lambda aid: prob[aid] * rng.random(), reverse=True)[:maximo]
    return sorted(activos), hora, mult


def construir_feed(config, estado, pidx, agente_id, ronda, rng):
    plat = config["plataforma"]
    cfg = indice_cfg_agentes(config)
    w_rec = plat.get("peso_recencia", 0.4)
    w_pop = plat.get("peso_popularidad", 0.3)
    w_rel = plat.get("peso_relevancia", 0.3)
    eco = plat.get("camara_eco", 0.5)
    umbral = plat.get("umbral_viral", 10)
    tamano = plat.get("tamano_feed", 6)
    sigue = set(estado["seguidores"].get(str(agente_id), []))
    silencia = set(estado["silenciados"].get(str(agente_id), []))
    mis_temas = set(palabras(" ".join(pidx[agente_id].get("temas", []))))
    mi_postura = cfg[agente_id].get("postura", "neutral")
    candidatos = []
    max_inter = max([interaccion(p) for p in estado["posts"].values()] + [1])
    for post in estado["posts"].values():
        if post["tipo"] == "comentario":
            continue
        autor = post["autor_id"]
        if autor == agente_id or autor in silencia:
            continue
        edad = ronda - post["ronda"]
        recencia = 0.5 ** (edad / 3.0)
        inter = max(0, interaccion(post))
        popularidad = math.log1p(inter) / math.log1p(max_inter) if max_inter > 0 else 0
        temas_post = set(palabras(" ".join(post.get("temas", [])) + " " + post["contenido"]))
        relevancia = len(mis_temas & temas_post) / max(1, len(mis_temas)) if mis_temas else 0.3
        if autor in sigue:
            relevancia += 0.5
        puntaje = w_rec * recencia + w_pop * popularidad + w_rel * min(1.0, relevancia)
        if autor != AUTOR_EXTERNO:
            puntaje *= math.sqrt(float(cfg.get(autor, {}).get("peso_influencia", 1.0)))
            sim = similitud_postura(mi_postura, cfg.get(autor, {}).get("postura", "neutral"))
            viral = inter >= umbral
            if not (viral and sim < 0):
                puntaje *= 1 + eco * sim
            if viral:
                puntaje *= 1.3
        else:
            puntaje *= 1.5  # los eventos externos se ven mucho
        ya = agente_id in post["likes"] + post["dislikes"] + post["reposts"] or any(
            estado["posts"][h]["autor_id"] == agente_id for h in post["comentarios"] + post.get("citas", []))
        if ya:
            puntaje *= 0.3
        puntaje *= 0.9 + 0.2 * rng.random()
        candidatos.append((puntaje, ya, post))
    candidatos.sort(key=lambda x: x[0], reverse=True)
    feed = []
    for _, ya, post in candidatos[:tamano]:
        nombre, usuario = nombre_autor(pidx, post["autor_id"])
        item = {
            "post_id": post["id"],
            "autor": f"{nombre} (@{usuario})",
            "tipo": post["tipo"],
            "contenido": post["contenido"][:400],
            "likes": len(post["likes"]),
            "reposts": len(post["reposts"]),
            "comentarios": len(post["comentarios"]),
            "hace_rondas": ronda - post["ronda"],
        }
        if ya:
            item["ya_reaccionaste"] = True
        if post["tipo"] == "cita" and post["padre_id"] in estado["posts"]:
            item["cita_a"] = estado["posts"][post["padre_id"]]["contenido"][:200]
        if config["plataforma"]["tipo"] == "reddit" and post["comentarios"]:
            ultimos = post["comentarios"][-2:]
            item["ultimos_comentarios"] = [
                f"@{nombre_autor(pidx, estado['posts'][cid]['autor_id'])[1]}: "
                f"{estado['posts'][cid]['contenido'][:200]}" for cid in ultimos
            ]
        feed.append(item)
    return feed


def memoria_reciente(estado, agente_id, n=4):
    propios = [p for p in estado["posts"].values() if p["autor_id"] == agente_id]
    propios.sort(key=lambda p: p["ronda"])
    return [f"[ronda {p['ronda']}, {p['tipo']} {p['id']}] {p['contenido'][:200]}" for p in propios[-n:]]


def cmd_ronda(args):
    c = args.carpeta
    personas, config, estado = cargar(c)
    if estado is None:
        fallar("la simulación no está iniciada; ejecuta 'iniciar' primero")
    if estado["pendiente"] is not None:
        print("Ya hay una ronda pendiente; aquí está otra vez:\n")
        print(open(os.path.join(c, "turno.json"), encoding="utf-8").read())
        return
    ronda = estado["ronda"] + 1
    if ronda > estado["total_rondas"]:
        print(f"La simulación terminó ({estado['total_rondas']} rondas). Puedes generar el informe.")
        return
    pidx = indice_personas(personas)
    cfg = indice_cfg_agentes(config)
    rng = random.Random(int(config.get("semilla", 42)) * 1000 + ronda)

    eventos = []
    for i, ev in enumerate(config["evento"].get("eventos_programados", [])):
        if int(ev["ronda"]) == ronda and i not in estado["eventos_aplicados"]:
            autor = int(ev.get("autor_id", AUTOR_EXTERNO))
            pid = nuevo_post(estado, autor, ronda, "post", ev["contenido"], temas=ev.get("temas"))
            estado["eventos_aplicados"].append(i)
            registrar(c, {"ronda": ronda, "tipo": "evento_programado", "agente_id": autor,
                          "post_id": pid, "contenido": ev["contenido"]})
            eventos.append(f"{pid}: {ev['contenido']}")

    activos, hora, mult = activar_agentes(config, personas, ronda, rng)
    agentes = []
    for aid in activos:
        p, a = pidx[aid], cfg[aid]
        feed = construir_feed(config, estado, pidx, aid, ronda, rng)
        agentes.append({
            "agente_id": aid,
            "nombre": p["nombre"],
            "usuario": p["usuario"],
            "tipo": p.get("tipo", ""),
            "postura": a.get("postura"),
            "sesgo_sentimiento": a.get("sesgo_sentimiento", 0.0),
            "bio": p.get("bio", ""),
            "rasgos": ", ".join(x for x in (f"{p['edad']} años" if p.get("edad") else "",
                                            p.get("profesion", ""),
                                            f"MBTI {p['mbti']}" if p.get("mbti") else "") if x),
            "lo_que_ha_publicado": memoria_reciente(estado, aid),
            "notificaciones": estado["notificaciones"].pop(str(aid), [])[-6:],
            "feed": feed,
        })
        registrar(c, {"ronda": ronda, "tipo": "vio_feed", "agente_id": aid,
                      "post_ids": [f["post_id"] for f in feed]})
    turno = {
        "ronda": ronda,
        "de": estado["total_rondas"],
        "hora_simulada": etiqueta_hora(config, ronda),
        "factor_actividad_hora": mult,
        "plataforma": config["plataforma"]["tipo"],
        "acciones_permitidas": ACCIONES[config["plataforma"]["tipo"]],
        "eventos_nuevos": eventos,
        "agentes": agentes,
    }
    estado["pendiente"] = {"ronda": ronda, "agentes": activos}
    escribir_json(os.path.join(c, "estado.json"), estado)
    escribir_json(os.path.join(c, "turno.json"), turno)
    print(json.dumps(turno, ensure_ascii=False, indent=1))


# ───────────────────────── aplicar ─────────────────────────

def cmd_aplicar(args):
    c = args.carpeta
    personas, config, estado = cargar(c)
    if estado is None or estado["pendiente"] is None:
        fallar("no hay ronda pendiente; ejecuta 'ronda' primero")
    acciones = leer_json(args.acciones)
    if isinstance(acciones, dict):
        acciones = acciones.get("acciones", [])
    ronda = estado["pendiente"]["ronda"]
    activos = set(estado["pendiente"]["agentes"])
    permitidas = ACCIONES[config["plataforma"]["tipo"]]
    pidx = indice_personas(personas)
    errores = []
    por_agente = Counter()

    # Validación completa antes de tocar el estado (todo o nada)
    for i, a in enumerate(acciones):
        aid, acc = a.get("agente_id"), a.get("accion")
        if aid not in activos:
            errores.append(f"#{i}: agente {aid} no está activo en esta ronda")
        if acc not in permitidas:
            errores.append(f"#{i}: acción {acc} no permitida en {config['plataforma']['tipo']}")
        por_agente[aid] += 1
        if acc in ("CREAR_POST", "COMENTAR", "CITAR") and not str(a.get("contenido", "")).strip():
            errores.append(f"#{i}: {acc} necesita 'contenido'")
        if acc in ("LIKE", "DISLIKE", "REPOST", "COMENTAR", "CITAR"):
            if a.get("post_id") not in estado["posts"]:
                errores.append(f"#{i}: post_id {a.get('post_id')} no existe")
        if acc in ("SEGUIR", "SILENCIAR") and a.get("objetivo_id") not in pidx:
            errores.append(f"#{i}: objetivo_id {a.get('objetivo_id')} no existe")
    for aid, n in por_agente.items():
        if n > MAX_ACCIONES_POR_AGENTE:
            errores.append(f"agente {aid} tiene {n} acciones (máximo {MAX_ACCIONES_POR_AGENTE})")
    faltan = activos - set(por_agente)
    if faltan:
        errores.append(f"faltan acciones de los agentes {sorted(faltan)} (usa NADA si no hacen nada)")
    if errores:
        for e in errores:
            print(f"PROBLEMA: {e}")
        fallar("no se aplicó nada; corrige el archivo de acciones y vuelve a ejecutar 'aplicar'")

    resumen = Counter()
    for a in acciones:
        aid, acc = a["agente_id"], a["accion"]
        _, usuario = nombre_autor(pidx, aid)
        ev = {"ronda": ronda, "tipo": acc, "agente_id": aid}
        if acc == "CREAR_POST":
            pid = nuevo_post(estado, aid, ronda, "post", a["contenido"], temas=a.get("temas"),
                             sentimiento=a.get("sentimiento", 0.0))
            ev.update(post_id=pid, contenido=a["contenido"])
        elif acc in ("COMENTAR", "CITAR"):
            tipo = "comentario" if acc == "COMENTAR" else "cita"
            padre = estado["posts"][a["post_id"]]
            pid = nuevo_post(estado, aid, ronda, tipo, a["contenido"], padre_id=a["post_id"],
                             temas=a.get("temas"), sentimiento=a.get("sentimiento", 0.0))
            notificar(estado, padre["autor_id"],
                      f"@{usuario} {'comentó' if tipo == 'comentario' else 'citó'} tu {a['post_id']}: "
                      f"{a['contenido'][:150]}")
            ev.update(post_id=pid, sobre=a["post_id"], contenido=a["contenido"])
        elif acc in ("LIKE", "DISLIKE", "REPOST"):
            post = estado["posts"][a["post_id"]]
            lista = {"LIKE": "likes", "DISLIKE": "dislikes", "REPOST": "reposts"}[acc]
            if aid not in post[lista]:
                post[lista].append(aid)
                if acc != "DISLIKE":
                    notificar(estado, post["autor_id"],
                              f"@{usuario} hizo {acc.lower()} a tu {a['post_id']}")
            ev.update(sobre=a["post_id"])
        elif acc in ("SEGUIR", "SILENCIAR"):
            clave = "seguidores" if acc == "SEGUIR" else "silenciados"
            lista = estado[clave].setdefault(str(aid), [])
            if a["objetivo_id"] not in lista:
                lista.append(a["objetivo_id"])
                if acc == "SEGUIR":
                    notificar(estado, a["objetivo_id"], f"@{usuario} empezó a seguirte")
            ev.update(objetivo_id=a["objetivo_id"])
        if a.get("razon"):
            ev["razon"] = a["razon"]
        registrar(c, ev)
        resumen[acc] += 1

    estado["ronda"] = ronda
    estado["pendiente"] = None
    escribir_json(os.path.join(c, "estado.json"), estado)
    os.remove(os.path.join(c, "turno.json"))
    detalle = ", ".join(f"{k}: {v}" for k, v in resumen.most_common())
    print(f"Ronda {ronda}/{estado['total_rondas']} aplicada ({etiqueta_hora(config, ronda)}). {detalle}")


# ───────────────────────── inyectar ─────────────────────────

def cmd_inyectar(args):
    c = args.carpeta
    personas, config, estado = cargar(c)
    if estado is None:
        fallar("la simulación no está iniciada")
    autor = AUTOR_EXTERNO if args.autor is None else int(args.autor)
    if autor != AUTOR_EXTERNO and autor not in indice_personas(personas):
        fallar(f"no existe el agente {autor}")
    temas = [t.strip() for t in (args.temas or "").split(",") if t.strip()]
    ronda = estado["ronda"]
    pid = nuevo_post(estado, autor, ronda, "post", args.texto, temas=temas)
    registrar(c, {"ronda": ronda, "tipo": "evento_inyectado", "agente_id": autor,
                  "post_id": pid, "contenido": args.texto})
    escribir_json(os.path.join(c, "estado.json"), estado)
    print(f"Evento inyectado como {pid}; aparecerá en los feeds desde la ronda {ronda + 1}.")


# ───────────────────────── consultas ─────────────────────────

def cmd_estado(args):
    personas, config, estado = cargar(args.carpeta)
    if estado is None:
        print("Simulación no iniciada.")
        return
    tipos = Counter(p["tipo"] for p in estado["posts"].values())
    print(f"Ronda {estado['ronda']}/{estado['total_rondas']} "
          f"({etiqueta_hora(config, estado['ronda'])}). "
          f"Pendiente: {'sí, ronda ' + str(estado['pendiente']['ronda']) if estado['pendiente'] else 'no'}.")
    print(f"Agentes: {len(personas)}. Publicaciones: {dict(tipos)}.")


def formatear_post(pidx, estado, post):
    nombre, usuario = nombre_autor(pidx, post["autor_id"])
    extra = ""
    if post["padre_id"]:
        extra = f" → sobre {post['padre_id']}"
    return (f"[{post['id']} | ronda {post['ronda']} | {post['tipo']}{extra} | {nombre} (@{usuario}) | "
            f"❤ {len(post['likes'])} ⟳ {len(post['reposts'])} 💬 {len(post['comentarios'])}]\n"
            f"  {post['contenido']}")


def cmd_buscar(args):
    personas, config, estado = cargar(args.carpeta)
    if estado is None:
        fallar("la simulación no está iniciada")
    pidx = indice_personas(personas)
    consulta = set(palabras(args.consulta or ""))
    desde, hasta = 0, 10 ** 9
    if args.rondas:
        partes = args.rondas.split("-")
        desde, hasta = int(partes[0]), int(partes[-1])
    resultados = []
    for post in estado["posts"].values():
        if args.agente is not None and post["autor_id"] != args.agente:
            continue
        if not desde <= post["ronda"] <= hasta:
            continue
        texto = set(palabras(post["contenido"] + " " + " ".join(post.get("temas", []))))
        puntaje = len(consulta & texto) if consulta else 1
        if consulta and puntaje == 0:
            continue
        resultados.append((puntaje, interaccion(post), post))
    resultados.sort(key=lambda x: (x[0], x[1]), reverse=True)
    if not resultados:
        print("Sin resultados.")
        return
    print(f"{len(resultados)} resultados (mostrando {min(args.n, len(resultados))}):\n")
    for _, _, post in resultados[: args.n]:
        print(formatear_post(pidx, estado, post) + "\n")


def cmd_panorama(args):
    personas, config, estado = cargar(args.carpeta)
    if estado is None:
        fallar("la simulación no está iniciada")
    pidx = indice_personas(personas)
    cfg = indice_cfg_agentes(config)
    posts = list(estado["posts"].values())
    print(f"# Panorama — ronda {estado['ronda']}/{estado['total_rondas']} "
          f"({etiqueta_hora(config, estado['ronda'])})\n")

    print("## Actividad y sentimiento por bloque de rondas")
    bloque = max(1, estado["ronda"] // 8 or 1)
    por_bloque = defaultdict(list)
    for p in posts:
        por_bloque[p["ronda"] // bloque].append(p)
    for b in sorted(por_bloque):
        ps = por_bloque[b]
        textos = [p for p in ps if p["tipo"] in ("post", "comentario", "cita")]
        sent = sum(p["sentimiento"] for p in textos) / len(textos) if textos else 0
        barra = "█" * min(40, len(ps))
        print(f"- rondas {b * bloque}-{b * bloque + bloque - 1}: {len(ps):3d} publicaciones, "
              f"sentimiento medio {sent:+.2f} {barra}")

    print("\n## Participación por postura")
    autores = Counter(p["autor_id"] for p in posts if p["autor_id"] != AUTOR_EXTERNO)
    por_postura = Counter()
    for aid, n in autores.items():
        por_postura[cfg.get(aid, {}).get("postura", "?")] += n
    for postura, n in por_postura.most_common():
        print(f"- {postura}: {n} publicaciones")

    print("\n## Agentes con más interacción recibida")
    recibida = Counter()
    for p in posts:
        recibida[p["autor_id"]] += max(0, interaccion(p))
    for aid, n in recibida.most_common(8):
        nombre, usuario = nombre_autor(pidx, aid)
        postura = cfg.get(aid, {}).get("postura", "-")
        print(f"- {nombre} (@{usuario}, {postura}): {n} interacciones, {autores.get(aid, 0)} publicaciones")

    print("\n## Publicaciones con más interacción")
    for p in sorted(posts, key=interaccion, reverse=True)[: args.n]:
        print(formatear_post(pidx, estado, p) + "\n")

    print("## Palabras más frecuentes")
    vacias = set("que los las del por con una para como esto esta pero mas sus son hay ser han muy sin sobre".split())
    cuenta = Counter(w for p in posts for w in palabras(p["contenido"]) if w not in vacias and len(w) > 3)
    print(", ".join(f"{w} ({n})" for w, n in cuenta.most_common(25)))

    registro = os.path.join(args.carpeta, "registro.jsonl")
    if os.path.exists(registro):
        inyectados = [json.loads(l) for l in open(registro, encoding="utf-8")
                      if '"evento_' in l]
        if inyectados:
            print("\n## Eventos externos e inyectados")
            for e in sorted(inyectados, key=lambda e: e["ronda"]):
                print(f"- ronda {e['ronda']} ({e['tipo']}): {e['contenido'][:200]}")


def cmd_agente(args):
    personas, config, estado = cargar(args.carpeta)
    if estado is None:
        fallar("la simulación no está iniciada")
    pidx = indice_personas(personas)
    aid = args.agente_id
    if aid not in pidx:
        fallar(f"no existe el agente {aid}")
    p = pidx[aid]
    a = indice_cfg_agentes(config).get(aid, {})
    print(f"# {p['nombre']} (@{p['usuario']}) — agente {aid}")
    print(f"Tipo: {p.get('tipo', '')} | Postura inicial: {a.get('postura')} | "
          f"Influencia: {a.get('peso_influencia')}")
    print(f"\n## Bio\n{p.get('bio', '')}\n\n## Persona\n{p.get('persona', '')}")
    if p.get("memoria"):
        print(f"\n## Memoria previa al evento\n{p['memoria']}")
    print("\n## Lo que hizo en la simulación")
    registro = os.path.join(args.carpeta, "registro.jsonl")
    vistos = set()
    if os.path.exists(registro):
        for linea in open(registro, encoding="utf-8"):
            e = json.loads(linea)
            if e.get("agente_id") != aid:
                continue
            if e["tipo"] == "vio_feed":
                vistos.update(e["post_ids"])
                continue
            detalle = e.get("contenido") or e.get("sobre") or e.get("objetivo_id") or ""
            if e["tipo"] in ("LIKE", "DISLIKE", "REPOST") and e.get("sobre") in estado["posts"]:
                detalle = f"{e['sobre']}: {estado['posts'][e['sobre']]['contenido'][:120]}"
            if e["tipo"] in ("SEGUIR", "SILENCIAR"):
                detalle = "@" + nombre_autor(pidx, e["objetivo_id"])[1]
            if e["tipo"] == "NADA":
                continue
            print(f"- ronda {e['ronda']} {e['tipo']}{' ' + e.get('post_id', '') if e.get('post_id') else ''}: {detalle}")
    print("\n## Reacciones que recibió")
    for post in estado["posts"].values():
        if post["autor_id"] != aid:
            continue
        for cid in post["comentarios"] + post.get("citas", []):
            com = estado["posts"][cid]
            print(f"- a su {post['id']}, @{nombre_autor(pidx, com['autor_id'])[1]} respondió: "
                  f"{com['contenido'][:200]}")
    sigue = [nombre_autor(pidx, x)[1] for x in estado["seguidores"].get(str(aid), [])]
    seguidores = [nombre_autor(pidx, int(k))[1] for k, v in estado["seguidores"].items() if aid in v]
    print(f"\nSigue a: {', '.join('@' + s for s in sigue) or 'nadie'}")
    print(f"Lo siguen: {', '.join('@' + s for s in seguidores) or 'nadie'}")
    if args.vistos and vistos:
        print("\n## Publicaciones de otros que llegó a ver")
        for pid in sorted(vistos, key=lambda x: int(x[1:])):
            print(formatear_post(pidx, estado, estado["posts"][pid]))


# ───────────────────────── CLI ─────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Motor de simulación de enjambre")
    sub = ap.add_subparsers(dest="comando", required=True)

    def con_carpeta(nombre, ayuda):
        s = sub.add_parser(nombre, help=ayuda)
        s.add_argument("carpeta")
        return s

    con_carpeta("validar", "revisa los archivos de la simulación")
    s = con_carpeta("iniciar", "crea estado.json")
    s.add_argument("--forzar", action="store_true")
    con_carpeta("ronda", "prepara la siguiente ronda")
    s = con_carpeta("aplicar", "aplica las acciones de la ronda pendiente")
    s.add_argument("acciones", help="archivo JSON con la lista de acciones")
    s = con_carpeta("inyectar", "inyecta un evento externo")
    s.add_argument("--texto", required=True)
    s.add_argument("--autor", type=int, default=None, help="id de agente; por defecto 'Fuente externa'")
    s.add_argument("--temas", default="")
    con_carpeta("estado", "progreso")
    s = con_carpeta("buscar", "busca publicaciones")
    s.add_argument("consulta", nargs="?", default="")
    s.add_argument("--agente", type=int, default=None)
    s.add_argument("--rondas", default=None, help="rango, p. ej. 1-6")
    s.add_argument("-n", type=int, default=15)
    s = con_carpeta("panorama", "resumen global")
    s.add_argument("-n", type=int, default=8)
    s = con_carpeta("agente", "historial de un agente")
    s.add_argument("agente_id", type=int)
    s.add_argument("--vistos", action="store_true", help="incluye lo que vio en su feed")

    args = ap.parse_args()
    {
        "validar": cmd_validar, "iniciar": cmd_iniciar, "ronda": cmd_ronda,
        "aplicar": cmd_aplicar, "inyectar": cmd_inyectar, "estado": cmd_estado,
        "buscar": cmd_buscar, "panorama": cmd_panorama, "agente": cmd_agente,
    }[args.comando](args)


if __name__ == "__main__":
    main()
