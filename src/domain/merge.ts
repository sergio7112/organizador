import type { Ajustes, Datos } from './types'

type ConId = { id: string }
type Registro = Record<string, unknown>

/** Compara dos valores ignorando el orden de las claves y los campos `undefined`. */
export function sonIguales(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false
    }
    return a.every((valor, indice) => sonIguales(valor, b[indice]))
  }

  if (esObjeto(a) && esObjeto(b)) {
    const clavesA = clavesDefinidas(a)
    const clavesB = clavesDefinidas(b)
    if (clavesA.length !== clavesB.length) return false
    return clavesA.every(
      (clave) => clave in b && sonIguales(a[clave], b[clave]),
    )
  }

  return false
}

function esObjeto(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null
}

function clavesDefinidas(objeto: Registro): string[] {
  return Object.keys(objeto).filter((clave) => objeto[clave] !== undefined)
}

function serializar(valor: unknown): string {
  return JSON.stringify(valor) ?? ''
}

/**
 * Cuando los dos dispositivos cambian el mismo campo de forma distinta se
 * elige siempre el mismo valor (el mayor en texto). Así ambos convergen y no
 * se sobrescriben en bucle.
 */
function elegirDeterminista(a: unknown, b: unknown): unknown {
  return serializar(a) >= serializar(b) ? a : b
}

function unirListas(a: unknown[], b: unknown[]): unknown[] {
  const union = [...a]
  for (const valor of b) {
    if (!union.some((actual) => sonIguales(actual, valor))) union.push(valor)
  }
  return union.sort((x, y) => serializar(x).localeCompare(serializar(y)))
}

/**
 * Combina un objeto modificado en los dos lados campo a campo. Si solo un lado
 * lo cambió, se respeta ese cambio; si ambos cambiaron lo mismo, no hay
 * conflicto.
 */
function fusionarObjeto<T extends ConId>(
  base: T | undefined,
  local: T,
  remoto: T,
): T {
  const camposLocal = local as unknown as Registro
  const camposRemoto = remoto as unknown as Registro
  const camposBase = base as unknown as Registro | undefined
  const claves = new Set([
    ...clavesDefinidas(camposLocal),
    ...clavesDefinidas(camposRemoto),
  ])
  const salida: Registro = {}

  for (const clave of claves) {
    const valorBase = camposBase?.[clave]
    const valorLocal = camposLocal[clave]
    const valorRemoto = camposRemoto[clave]

    // Los temas de un examen son un conjunto: si los dos dispositivos añaden
    // temas distintos, se conservan todos.
    if (
      clave === 'temaIds' &&
      camposBase &&
      Array.isArray(valorLocal) &&
      Array.isArray(valorRemoto) &&
      !sonIguales(valorLocal, valorBase) &&
      !sonIguales(valorRemoto, valorBase)
    ) {
      salida[clave] = unirListas(valorLocal, valorRemoto)
      continue
    }

    let valor: unknown
    if (sonIguales(valorLocal, valorRemoto)) {
      valor = valorLocal
    } else if (camposBase && sonIguales(valorLocal, valorBase)) {
      valor = valorRemoto
    } else if (camposBase && sonIguales(valorRemoto, valorBase)) {
      valor = valorLocal
    } else {
      valor = elegirDeterminista(valorLocal, valorRemoto)
    }

    if (valor !== undefined) salida[clave] = valor
  }

  return salida as unknown as T
}

/**
 * Fusiona una lista de entidades con identificador. Si un elemento se borró en
 * un dispositivo y no se tocó en el otro, se borra; si el otro lo modificó, se
 * conserva la modificación para no perder trabajo.
 */
function fusionarLista<T extends ConId>(
  base: readonly T[],
  local: readonly T[],
  remoto: readonly T[],
): T[] {
  const porId = (lista: readonly T[]) =>
    new Map(lista.map((elemento) => [elemento.id, elemento]))
  const mapaBase = porId(base)
  const mapaLocal = porId(local)
  const mapaRemoto = porId(remoto)
  const ids = new Set([
    ...mapaBase.keys(),
    ...mapaLocal.keys(),
    ...mapaRemoto.keys(),
  ])
  const resultado: T[] = []

  for (const id of ids) {
    const enBase = mapaBase.get(id)
    const enLocal = mapaLocal.get(id)
    const enRemoto = mapaRemoto.get(id)

    if (!enLocal && !enRemoto) continue

    if (!enLocal) {
      // Borrado en este dispositivo (o creado solo en el otro).
      if (!enBase) {
        resultado.push(enRemoto!)
      } else if (!sonIguales(enRemoto, enBase)) {
        resultado.push(enRemoto!)
      }
      continue
    }

    if (!enRemoto) {
      // Borrado en el otro dispositivo (o creado solo en este).
      if (!enBase || !sonIguales(enLocal, enBase)) resultado.push(enLocal)
      continue
    }

    if (!enBase) {
      resultado.push(
        sonIguales(enLocal, enRemoto)
          ? enLocal
          : fusionarObjeto(undefined, enLocal, enRemoto),
      )
      continue
    }

    if (sonIguales(enLocal, enBase)) {
      resultado.push(enRemoto)
    } else if (sonIguales(enRemoto, enBase)) {
      resultado.push(enLocal)
    } else {
      resultado.push(fusionarObjeto(enBase, enLocal, enRemoto))
    }
  }

  // Orden estable entre dispositivos: evita que dos clientes se envíen la
  // misma lista en órdenes distintos una y otra vez.
  return resultado.sort((a, b) => a.id.localeCompare(b.id))
}

function fusionarAjustes(
  base: Ajustes | undefined,
  local: Ajustes,
  remoto: Ajustes,
): Ajustes {
  const elegir = (clave: 'tema' | 'vistaCalendario') => {
    const valorBase = base?.[clave]
    const valorLocal = local[clave]
    const valorRemoto = remoto[clave]
    if (sonIguales(valorLocal, valorRemoto)) return valorLocal
    if (base && sonIguales(valorLocal, valorBase)) return valorRemoto
    if (base && sonIguales(valorRemoto, valorBase)) return valorLocal
    return elegirDeterminista(valorLocal, valorRemoto)
  }

  return {
    tema: elegir('tema') as Ajustes['tema'],
    vistaCalendario: elegir('vistaCalendario') as Ajustes['vistaCalendario'],
    // Es una preferencia de cada dispositivo: encender o apagar la
    // sincronización en el móvil no debe afectar al ordenador.
    sincronizacionAutomatica: local.sincronizacionAutomatica,
  }
}

/**
 * Fusiona los datos locales con los del servidor usando como referencia el
 * último estado sincronizado (`base`). El resultado es el mismo en cualquier
 * dispositivo, aunque los cambios se hayan hecho a la vez.
 */
export function fusionarTresVias(
  base: Datos | null,
  local: Datos,
  remoto: Datos,
): Datos {
  return {
    version: Math.max(local.version, remoto.version),
    asignaturas: fusionarLista(
      base?.asignaturas ?? [],
      local.asignaturas,
      remoto.asignaturas,
    ),
    temas: fusionarLista(base?.temas ?? [], local.temas, remoto.temas),
    examenes: fusionarLista(
      base?.examenes ?? [],
      local.examenes,
      remoto.examenes,
    ),
    tareas: fusionarLista(base?.tareas ?? [], local.tareas, remoto.tareas),
    proyectos: fusionarLista(
      base?.proyectos ?? [],
      local.proyectos,
      remoto.proyectos,
    ),
    checklist: fusionarLista(
      base?.checklist ?? [],
      local.checklist,
      remoto.checklist,
    ),
    repasos: fusionarLista(base?.repasos ?? [], local.repasos, remoto.repasos),
    errores: fusionarLista(base?.errores ?? [], local.errores, remoto.errores),
    ajustes: fusionarAjustes(base?.ajustes, local.ajustes, remoto.ajustes),
  }
}
