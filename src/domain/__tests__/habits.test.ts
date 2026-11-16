import { describe, expect, it } from 'vitest'
import { habitoSeEspera, habitosDeHoy } from '../habits'
import { crearDatosVacios } from '../empty'
import type { Habito } from '../types'

function habito(cambios: Partial<Habito> & Pick<Habito, 'id' | 'frecuencia'>): Habito {
  return {
    nombre: 'Hábito',
    color: '#1f4e79',
    archivado: false,
    creadoEn: '2026-11-16T08:00:00.000Z',
    orden: 0,
    ...cambios,
  }
}

// 2026-11-16 es lunes; el domingo de esa semana es el 22.
const lunes = '2026-11-16'
const martes = '2026-11-17'
const domingo = '2026-11-22'

describe('calendario de hábitos', () => {
  it('los hábitos diarios toca hacerlos cualquier día', () => {
    const diario = habito({ id: 'h1', frecuencia: 'diaria' })
    expect(habitoSeEspera(diario, lunes)).toBe(true)
    expect(habitoSeEspera(diario, domingo)).toBe(true)
  })

  it('respeta los días marcados en los hábitos semanales y personalizados', () => {
    const semanal = habito({ id: 'h2', frecuencia: 'semanal', diasSemana: [1, 3, 5] })
    expect(habitoSeEspera(semanal, lunes)).toBe(true)
    expect(habitoSeEspera(semanal, martes)).toBe(false)

    const personalizado = habito({ id: 'h3', frecuencia: 'personalizada', diasSemana: [0] })
    expect(habitoSeEspera(personalizado, domingo)).toBe(true)
    expect(habitoSeEspera(personalizado, lunes)).toBe(false)
  })

  it('solo espera los hábitos mensuales el día del mes indicado', () => {
    const mensual = habito({ id: 'h4', frecuencia: 'mensual', diaMes: 16 })
    expect(habitoSeEspera(mensual, lunes)).toBe(true)
    expect(habitoSeEspera(mensual, martes)).toBe(false)
  })

  it('sin días configurados no se espera el hábito', () => {
    const semanal = habito({ id: 'h5', frecuencia: 'semanal' })
    expect(habitoSeEspera(semanal, lunes)).toBe(false)
  })
})

describe('habitosDeHoy', () => {
  it('devuelve solo los activos que tocan hoy, en orden manual', () => {
    const datos = crearDatosVacios()
    datos.habitos = [
      habito({ id: 'h1', frecuencia: 'diaria', orden: 2, nombre: 'Leer' }),
      habito({ id: 'h2', frecuencia: 'semanal', diasSemana: [2], orden: 0, nombre: 'Piscina' }),
      habito({ id: 'h3', frecuencia: 'diaria', orden: 1, nombre: 'Beber agua' }),
      habito({ id: 'h4', frecuencia: 'diaria', orden: 3, archivado: true }),
    ]

    expect(habitosDeHoy(datos, lunes).map((h) => h.nombre)).toEqual([
      'Beber agua',
      'Leer',
    ])
  })
})
