import { describe, expect, it } from 'vitest'
import type { Asignatura, Datos, Examen, Repaso, Tarea, Tema } from '../types'
import { progresoExamen, examenesFuturos, proximoExamen } from '../exams'
import { agruparPorFecha, eventosCalendario, eventosDelDia } from '../calendar'
import { sugerenciaDeEstudio, tareasDeHoy, temasEnEstudio } from '../today'
import { agruparTareas } from '../tasks'
import { crearRepasos, repasosPendientes, estadoTrasCompletarRepaso } from '../spacedRepetition'

const HOY = '2026-11-13'

function asignatura(id: string, nombre: string): Asignatura {
  return { id, nombre, color: '#4f46e5', orden: 0, creadaEn: HOY }
}

function tema(
  id: string,
  asignaturaId: string,
  estado: Tema['estado'],
  orden = 0,
): Tema {
  return {
    id,
    asignaturaId,
    titulo: `Tema ${id}`,
    estado,
    orden,
    actualizadoEn: HOY,
  }
}

function tarea(
  id: string,
  fechaLimite: string,
  prioridad: Tarea['prioridad'],
  estado: Tarea['estado'] = 'pendiente',
): Tarea {
  return {
    id,
    titulo: `Tarea ${id}`,
    fechaLimite,
    prioridad,
    estado,
    creadaEn: HOY,
  }
}

function examen(
  id: string,
  fecha: string,
  asignaturaId: string,
  temaIds: string[],
): Examen {
  return { id, asignaturaId, titulo: `Examen ${id}`, fecha, temaIds, creadoEn: HOY }
}

function datos(parcial: Partial<Datos>): Datos {
  return {
    version: 1,
    asignaturas: [],
    temas: [],
    examenes: [],
    tareas: [],
    proyectos: [],
    checklist: [],
    repasos: [],
    errores: [],
    ajustes: { tema: 'sistema', vistaCalendario: 'mes', sincronizacionAutomatica: true },
    ...parcial,
  }
}

describe('progresoExamen', () => {
  it('cuenta solo los temas dominados y calcula el avance ponderado', () => {
    const temas = [
      tema('1', 'mat', 'dominado'),
      tema('2', 'mat', 'dominado'),
      tema('3', 'mat', 'repasado'),
      tema('4', 'mat', 'sin_empezar'),
    ]
    const progreso = progresoExamen(
      examen('e1', '2026-11-20', 'mat', ['1', '2', '3', '4']),
      temas,
    )

    expect(progreso.total).toBe(4)
    expect(progreso.dominados).toBe(2)
    expect(progreso.porcentajeDominado).toBe(50)
    expect(progreso.porcentajeAvance).toBe(67)
  })

  it('ignora los temas que no pertenecen al examen', () => {
    const temas = [tema('1', 'mat', 'dominado'), tema('2', 'mat', 'dominado')]
    const progreso = progresoExamen(examen('e1', '2026-11-20', 'mat', ['1']), temas)
    expect(progreso.total).toBe(1)
    expect(progreso.porcentajeDominado).toBe(100)
  })

  it('devuelve 0 % si el examen no tiene temas', () => {
    const progreso = progresoExamen(examen('e1', '2026-11-20', 'mat', []), [])
    expect(progreso.porcentajeDominado).toBe(0)
    expect(progreso.porcentajeAvance).toBe(0)
  })
})

describe('examenesFuturos', () => {
  it('excluye los pasados y ordena del más cercano al más lejano', () => {
    const examenes = [
      examen('lejano', '2026-12-01', 'mat', ['1']),
      examen('pasado', '2026-11-01', 'mat', ['1']),
      examen('hoy', HOY, 'mat', ['1']),
      examen('cercano', '2026-11-18', 'mat', ['1']),
    ]

    expect(examenesFuturos(examenes, HOY).map((e) => e.id)).toEqual([
      'hoy',
      'cercano',
      'lejano',
    ])
    expect(proximoExamen(examenes, HOY)?.id).toBe('hoy')
  })

  it('devuelve null si todos los exámenes ya pasaron', () => {
    const examenes = [examen('pasado', '2026-11-01', 'mat', ['1'])]
    expect(proximoExamen(examenes, HOY)).toBeNull()
  })
})

describe('eventosCalendario', () => {
  it('une exámenes y tareas activas, con los exámenes primero en el mismo día', () => {
    const base = datos({
      asignaturas: [asignatura('mat', 'Matemáticas II')],
      examenes: [examen('e1', '2026-11-20', 'mat', ['1'])],
      tareas: [
        { ...tarea('t1', '2026-11-20', 'alta'), vinculo: { tipo: 'asignatura', id: 'mat' } },
        tarea('t2', '2026-11-21', 'media', 'hecha'),
      ],
    })

    const eventos = eventosCalendario(base)
    expect(eventos.map((e) => e.tipo)).toEqual(['examen', 'tarea'])
    expect(eventos[0].color).toBe('#4f46e5')

    const conHechas = eventosCalendario(base, { incluirHechas: true })
    expect(conHechas).toHaveLength(3)
  })

  it('agrupa por fecha y filtra por día', () => {
    const base = datos({
      asignaturas: [asignatura('mat', 'Matemáticas II')],
      examenes: [examen('e1', '2026-11-20', 'mat', ['1'])],
      tareas: [tarea('t1', '2026-11-21', 'media')],
    })
    const eventos = eventosCalendario(base)
    const mapa = agruparPorFecha(eventos)

    expect([...mapa.keys()]).toEqual(['2026-11-20', '2026-11-21'])
    expect(eventosDelDia(eventos, '2026-11-20')).toHaveLength(1)
    expect(eventosDelDia(eventos, '2026-11-22')).toHaveLength(0)
  })
})

describe('tareasDeHoy', () => {
  it('incluye atrasadas y de hoy, excluye futuras y hechas, y ordena por prioridad', () => {
    const tareas = [
      tarea('futura', '2026-11-14', 'alta'),
      tarea('hecha', HOY, 'alta', 'hecha'),
      tarea('hoy-baja', HOY, 'baja'),
      tarea('atrasada-alta', '2026-11-10', 'alta'),
      tarea('hoy-media', HOY, 'media'),
    ]

    expect(tareasDeHoy(tareas, HOY).map((t) => t.id)).toEqual([
      'atrasada-alta',
      'hoy-media',
      'hoy-baja',
    ])
  })
})

describe('agruparTareas', () => {
  it('separa atrasadas, hoy, próximos 7 días, más adelante y completadas', () => {
    const tareas = [
      tarea('atrasada', '2026-11-12', 'media'),
      tarea('hoy', HOY, 'media'),
      tarea('semana', '2026-11-18', 'media'),
      tarea('despues', '2026-12-01', 'media'),
      tarea('hecha', '2026-11-01', 'media', 'hecha'),
    ]

    const grupos = agruparTareas(tareas, HOY)
    expect(grupos.map((g) => g.clave)).toEqual([
      'atrasadas',
      'hoy',
      'semana',
      'mas_adelante',
      'completadas',
    ])
    expect(grupos[0].tareas[0].id).toBe('atrasada')
    expect(grupos[4].tareas[0].id).toBe('hecha')
  })
})

describe('sugerenciaDeEstudio', () => {
  it('elige el examen más cercano con temario pendiente y el tema menos avanzado', () => {
    const temas = [
      tema('repasado', 'mat', 'repasado', 0),
      tema('sin-empezar', 'mat', 'sin_empezar', 1),
      tema('dominado', 'mat', 'dominado', 2),
    ]
    const base = datos({
      asignaturas: [asignatura('mat', 'Matemáticas II')],
      temas,
      examenes: [
        examen('lejano', '2026-12-01', 'mat', ['sin-empezar']),
        examen('cercano', '2026-11-18', 'mat', ['repasado', 'sin-empezar', 'dominado']),
      ],
    })

    const sugerencia = sugerenciaDeEstudio(base, HOY)
    expect(sugerencia?.examen.id).toBe('cercano')
    expect(sugerencia?.tema.id).toBe('sin-empezar')
    expect(sugerencia?.porcentajeDominado).toBe(33)
  })

  it('prioriza un tema con repaso pendiente', () => {
    const temas = [
      tema('repasado', 'mat', 'repasado', 0),
      tema('sin-empezar', 'mat', 'sin_empezar', 1),
    ]
    const repasos: Repaso[] = [
      {
        id: 'r1',
        temaId: 'repasado',
        fecha: HOY,
        intervaloDias: 1,
        programadoEn: HOY,
      },
    ]
    const base = datos({
      asignaturas: [asignatura('mat', 'Matemáticas II')],
      temas,
      repasos,
      examenes: [examen('e1', '2026-11-18', 'mat', ['repasado', 'sin-empezar'])],
    })

    const sugerencia = sugerenciaDeEstudio(base, HOY)
    expect(sugerencia?.tema.id).toBe('repasado')
    expect(sugerencia?.repasoPendiente).toBe(true)
  })

  it('devuelve null si no hay exámenes futuros', () => {
    expect(sugerenciaDeEstudio(datos({}), HOY)).toBeNull()
  })
})

describe('repaso espaciado', () => {
  it('programa repasos a 1, 3 y 7 días', () => {
    const repasos = crearRepasos('tema-1', HOY)
    expect(repasos.map((r) => r.fecha)).toEqual([
      '2026-11-14',
      '2026-11-16',
      '2026-11-20',
    ])
    expect(repasos.map((r) => r.intervaloDias)).toEqual([1, 3, 7])
  })

  it('devuelve solo los repasos vencidos o de hoy', () => {
    const repasos = crearRepasos('tema-1', HOY)
    const pendientes = repasosPendientes(repasos, '2026-11-16')
    expect(pendientes.map((r) => r.intervaloDias)).toEqual([1, 3])
  })

  it('no incluye repasos completados', () => {
    const repasos = crearRepasos('tema-1', HOY).map((repaso) => ({
      ...repaso,
      completadoEn: HOY,
    }))
    expect(repasosPendientes(repasos, '2026-11-30')).toHaveLength(0)
  })
})

describe('estadoTrasCompletarRepaso', () => {
  it('pasa a repasado con los repasos de 1 y 3 días y a dominado con el de 7', () => {
    const estudiando = tema('t', 'mat', 'estudiando')
    const base: Repaso = {
      id: 'r',
      temaId: 't',
      fecha: HOY,
      intervaloDias: 1,
      programadoEn: HOY,
    }

    expect(estadoTrasCompletarRepaso(base, estudiando)).toBe('repasado')
    expect(
      estadoTrasCompletarRepaso({ ...base, intervaloDias: 3 }, estudiando),
    ).toBe('repasado')
    expect(
      estadoTrasCompletarRepaso({ ...base, intervaloDias: 7 }, estudiando),
    ).toBe('dominado')
  })

  it('no retrocede el estado de un tema ya avanzado', () => {
    const dominado = tema('t', 'mat', 'dominado')
    const repaso: Repaso = {
      id: 'r',
      temaId: 't',
      fecha: HOY,
      intervaloDias: 1,
      programadoEn: HOY,
    }
    expect(estadoTrasCompletarRepaso(repaso, dominado)).toBe('dominado')
  })
})

describe('temasEnEstudio', () => {
  it('ordena del más reciente al más antiguo', () => {
    const temas: Tema[] = [
      { ...tema('a', 'mat', 'estudiando'), actualizadoEn: '2026-11-10T10:00:00Z' },
      { ...tema('b', 'mat', 'dominado'), actualizadoEn: '2026-11-12T10:00:00Z' },
      { ...tema('c', 'mat', 'estudiando'), actualizadoEn: '2026-11-11T10:00:00Z' },
    ]
    expect(temasEnEstudio(temas).map((t) => t.id)).toEqual(['c', 'a'])
  })
})
