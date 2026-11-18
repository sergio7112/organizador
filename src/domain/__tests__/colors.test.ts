import { describe, expect, it } from 'vitest'
import { colorCalido, migrarColoresCalidos } from '../colors'

describe('migración de colores antiguos', () => {
  it('convierte los colores fríos de versiones anteriores', () => {
    expect(colorCalido('#4f46e5')).toBe('#9f1239')
    expect(colorCalido('#2563eb')).toBe('#f0616d')
    expect(colorCalido('#0891b2')).toBe('#c2410c')
    expect(colorCalido('#7c3aed')).toBe('#86198f')
    expect(colorCalido('#E11D48')).toBe('#db2777')
  })

  it('mantiene los colores actuales y los personalizados', () => {
    expect(colorCalido('#e60023')).toBe('#e60023')
    expect(colorCalido('#123456')).toBe('#123456')
  })

  it('migra asignaturas y proyectos sin tocar el resto de datos', () => {
    const datos = migrarColoresCalidos({
      asignaturas: [
        {
          id: 'asig-1',
          nombre: 'Física',
          color: '#7c3aed',
          orden: 0,
          creadaEn: '2026-11-14T10:00:00.000Z',
        },
      ],
      proyectos: [
        {
          id: 'proy-1',
          nombre: 'Trabajo',
          color: '#0891b2',
          notasMarkdown: '',
          creadoEn: '2026-11-14T10:00:00.000Z',
        },
      ],
      ajustes: {
        tema: 'claro',
        vistaCalendario: 'mes',
        sincronizacionAutomatica: true,
        notificacionesResumenDiario: false,
        horaResumenDiario: '08:00',
        notificacionesProximosEventos: false,
        horaAvisosProximosEventos: '09:00',
      },
    })

    expect(datos.asignaturas?.[0].color).toBe('#86198f')
    expect(datos.proyectos?.[0].color).toBe('#c2410c')
    expect(datos.ajustes).toEqual({
      tema: 'claro',
      vistaCalendario: 'mes',
      sincronizacionAutomatica: true,
      notificacionesResumenDiario: false,
      horaResumenDiario: '08:00',
      notificacionesProximosEventos: false,
      horaAvisosProximosEventos: '09:00',
    })
  })
})
