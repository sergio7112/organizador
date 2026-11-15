import { describe, expect, it } from 'vitest'
import type { Datos, Examen, Tarea, Tema } from '../types'
import { fusionarTresVias, sonIguales } from '../merge'
import { crearDatosVacios } from '../empty'

function datos(parcial: Partial<Datos> = {}): Datos {
  return { ...crearDatosVacios(), ...parcial }
}

function tarea(id: string, cambios: Partial<Tarea> = {}): Tarea {
  return {
    id,
    titulo: `Tarea ${id}`,
    fechaLimite: '2026-11-20',
    prioridad: 'media',
    estado: 'pendiente',
    creadaEn: '2026-11-15T10:00:00.000Z',
    ...cambios,
  }
}

function tema(id: string, cambios: Partial<Tema> = {}): Tema {
  return {
    id,
    asignaturaId: 'asig-1',
    titulo: `Tema ${id}`,
    estado: 'sin_empezar',
    orden: 0,
    actualizadoEn: '2026-11-15T10:00:00.000Z',
    ...cambios,
  }
}

function examen(id: string, temaIds: string[]): Examen {
  return {
    id,
    asignaturaId: 'asig-1',
    titulo: 'Examen',
    fecha: '2026-12-01',
    temaIds,
    creadoEn: '2026-11-15T10:00:00.000Z',
  }
}

describe('sonIguales', () => {
  it('ignora el orden de las claves y los campos indefinidos', () => {
    expect(sonIguales({ a: 1, b: undefined }, { b: undefined, a: 1 })).toBe(true)
    expect(sonIguales({ a: 1 }, { a: 2 })).toBe(false)
    expect(sonIguales([1, 2], [1, 2, 3])).toBe(false)
  })
})

describe('fusión a tres bandas', () => {
  it('conserva un cambio hecho solo en este dispositivo', () => {
    const base = datos({ tareas: [tarea('t1')] })
    const local = datos({ tareas: [tarea('t1', { titulo: 'Cambiada' })] })
    const remoto = datos({ tareas: [tarea('t1')] })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusion.tareas[0].titulo).toBe('Cambiada')
  })

  it('aplica un cambio hecho solo en el otro dispositivo', () => {
    const base = datos({ tareas: [tarea('t1')] })
    const local = datos({ tareas: [tarea('t1')] })
    const remoto = datos({ tareas: [tarea('t1', { titulo: 'Desde el móvil' })] })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusion.tareas[0].titulo).toBe('Desde el móvil')
  })

  it('combina cambios distintos del mismo elemento', () => {
    const base = datos({ tareas: [tarea('t1')] })
    const local = datos({ tareas: [tarea('t1', { titulo: 'Nuevo título' })] })
    const remoto = datos({
      tareas: [
        tarea('t1', {
          estado: 'hecha',
          completadaEn: '2026-11-15T12:00:00.000Z',
        }),
      ],
    })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusion.tareas[0]).toMatchObject({
      titulo: 'Nuevo título',
      estado: 'hecha',
      completadaEn: '2026-11-15T12:00:00.000Z',
    })
  })

  it('resuelve igual un conflicto aunque cambie el orden de los lados', () => {
    const base = datos({ tareas: [tarea('t1', { titulo: 'Original' })] })
    const uno = datos({ tareas: [tarea('t1', { titulo: 'Cambio A' })] })
    const dos = datos({ tareas: [tarea('t1', { titulo: 'Cambio B' })] })

    const ida = fusionarTresVias(base, uno, dos)
    const vuelta = fusionarTresVias(base, dos, uno)
    expect(ida.tareas[0].titulo).toBe(vuelta.tareas[0].titulo)
    expect(ida).toEqual(vuelta)
  })

  it('une tareas nuevas creadas en los dos dispositivos', () => {
    const base = datos()
    const local = datos({ tareas: [tarea('t-local')] })
    const remoto = datos({ tareas: [tarea('t-remota')] })

    const ida = fusionarTresVias(base, local, remoto)
    expect(ida.tareas.map((actual) => actual.id)).toEqual([
      't-local',
      't-remota',
    ])
    expect(fusionarTresVias(base, remoto, local)).toEqual(ida)
  })

  it('propaga un borrado cuando el otro lado no lo tocó', () => {
    const base = datos({ tareas: [tarea('t1'), tarea('t2')] })
    const local = datos({ tareas: [tarea('t2')] })
    const remoto = datos({ tareas: [tarea('t1'), tarea('t2')] })

    expect(fusionarTresVias(base, local, remoto).tareas).toEqual([tarea('t2')])
  })

  it('conserva un elemento borrado en un lado pero editado en el otro', () => {
    const base = datos({ tareas: [tarea('t1')] })
    const local = datos({ tareas: [] })
    const remoto = datos({ tareas: [tarea('t1', { titulo: 'Editada' })] })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusion.tareas).toHaveLength(1)
    expect(fusion.tareas[0].titulo).toBe('Editada')
  })

  it('une los temas añadidos a un examen desde ambos lados', () => {
    const base = datos({ examenes: [examen('e1', ['t1'])] })
    const local = datos({ examenes: [examen('e1', ['t1', 't2'])] })
    const remoto = datos({ examenes: [examen('e1', ['t1', 't3'])] })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusion.examenes[0].temaIds).toEqual(['t1', 't2', 't3'])
  })

  it('mantiene la preferencia de sincronización de cada dispositivo', () => {
    const base = datos()
    const local = datos({
      ajustes: { ...base.ajustes, tema: 'oscuro', sincronizacionAutomatica: false },
    })
    const remoto = datos({
      ajustes: { ...base.ajustes, tema: 'claro', sincronizacionAutomatica: true },
    })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusion.ajustes.tema).toBe('oscuro')
    expect(fusion.ajustes.sincronizacionAutomatica).toBe(false)
  })

  it('es estable al repetir la fusión', () => {
    const base = datos({ temas: [tema('t1')] })
    const local = datos({ temas: [tema('t1', { titulo: 'Local' }), tema('t2')] })
    const remoto = datos({ temas: [tema('t1', { estado: 'estudiando' })] })

    const fusion = fusionarTresVias(base, local, remoto)
    expect(fusionarTresVias(base, fusion, fusion)).toEqual(fusion)
  })
})
