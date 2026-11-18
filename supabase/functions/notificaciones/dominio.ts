/** Contenido de los avisos push, sin dependencias de red. */

export interface AjustesPush {
  notificacionesResumenDiario?: boolean
  horaResumenDiario?: string
  notificacionesProximosEventos?: boolean
  horaAvisosProximosEventos?: string
}

export interface TareaPush {
  id: string
  titulo: string
  fechaLimite: string
  estado: string
}

export interface ExamenPush {
  id: string
  titulo: string
  fecha: string
}

export interface HabitoPush {
  id: string
  nombre: string
  frecuencia: string
  diasSemana?: number[]
  diaMes?: number
  archivado: boolean
}

export interface RegistroHabitoPush {
  habitoId: string
  fecha: string
  completado: boolean
}

export interface DatosPush {
  ajustes?: AjustesPush
  tareas?: TareaPush[]
  examenes?: ExamenPush[]
  habitos?: HabitoPush[]
  registrosHabitos?: RegistroHabitoPush[]
}

export interface MensajePush {
  title: string
  body: string
  url: string
  tag: string
}

export interface Aviso {
  /** Identifica el aviso para no repetirlo: "resumen:2026-11-18". */
  clave: string
  /** Hora local "HH:mm" a la que debe enviarse. */
  hora: string
  mensaje: MensajePush
}

/** Fecha y hora locales de un instante, según la zona del dispositivo. */
export function horaLocal(
  ahora: Date,
  zona: string,
): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora)

  const valor = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '00'

  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    hora: `${valor('hour')}:${valor('minute')}`,
  }
}

/** Día siguiente a una fecha ISO, sin depender de la zona del servidor. */
export function diaSiguiente(fecha: string): string {
  const dia = new Date(`${fecha}T12:00:00.000Z`)
  dia.setUTCDate(dia.getUTCDate() + 1)
  return dia.toISOString().slice(0, 10)
}

function tocaEseDia(habito: HabitoPush, fecha: string): boolean {
  if (habito.archivado) return false
  const dia = new Date(`${fecha}T12:00:00.000Z`)

  switch (habito.frecuencia) {
    case 'diaria':
      return true
    case 'mensual':
      return habito.diaMes === dia.getUTCDate()
    case 'semanal':
    case 'personalizada':
      return habito.diasSemana?.includes(dia.getUTCDay()) ?? false
    default:
      return false
  }
}

function plural(cantidad: number, singular: string, plural_: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural_}`
}

/**
 * Indica si toca enviar un aviso. Se admite un margen para que un retraso del
 * cron de pocos minutos no haga perder el aviso del día.
 */
export function tocaEnviar(
  objetivo: string,
  ahora: string,
  margenMinutos = 10,
): boolean {
  const [horaObjetivo, minutoObjetivo] = objetivo.split(':').map(Number)
  const [horaActual, minutoActual] = ahora.split(':').map(Number)

  if (
    !Number.isFinite(horaObjetivo) ||
    !Number.isFinite(minutoObjetivo) ||
    !Number.isFinite(horaActual) ||
    !Number.isFinite(minutoActual)
  ) {
    return objetivo === ahora
  }

  const diferencia =
    horaActual * 60 + minutoActual - (horaObjetivo * 60 + minutoObjetivo)
  return diferencia >= 0 && diferencia < margenMinutos
}

/**
 * Avisos que tocan hoy. Cada uno lleva la hora a la que debe salir, así el
 * proceso por minutos solo tiene que comparar con la hora local.
 */
export function crearAvisos(datos: DatosPush, fecha: string): Aviso[] {
  const ajustes = datos.ajustes ?? {}
  const tareas = datos.tareas ?? []
  const examenes = datos.examenes ?? []
  const habitos = datos.habitos ?? []
  const registros = datos.registrosHabitos ?? []
  const manana = diaSiguiente(fecha)

  const pendientes = tareas.filter(
    (tarea) => tarea.estado !== 'hecha' && tarea.fechaLimite <= fecha,
  )
  const atrasadas = pendientes.filter((tarea) => tarea.fechaLimite < fecha).length
  const habitosPendientes = habitos.filter(
    (habito) =>
      tocaEseDia(habito, fecha) &&
      !registros.some(
        (registro) =>
          registro.habitoId === habito.id &&
          registro.fecha === fecha &&
          registro.completado,
      ),
  )

  const avisos: Aviso[] = []

  if (ajustes.notificacionesResumenDiario) {
    const partes = [
      pendientes.length ? plural(pendientes.length, 'tarea pendiente', 'tareas pendientes') : '',
      atrasadas ? plural(atrasadas, 'atrasada', 'atrasadas') : '',
      habitosPendientes.length
        ? `${plural(habitosPendientes.length, 'hábito', 'hábitos')} para marcar`
        : '',
    ].filter(Boolean)

    if (partes.length) {
      avisos.push({
        clave: `resumen:${fecha}`,
        hora: ajustes.horaResumenDiario ?? '08:00',
        mensaje: {
          title: 'Tu día en Organizador',
          body: partes.join(' · '),
          url: '#/hoy',
          tag: `resumen-${fecha}`,
        },
      })
    }
  }

  if (ajustes.notificacionesProximosEventos) {
    const tareasManana = tareas.filter(
      (tarea) => tarea.estado !== 'hecha' && tarea.fechaLimite === manana,
    ).length
    const examenesManana = examenes.filter((examen) => examen.fecha === manana).length
    const partes = [
      tareasManana ? plural(tareasManana, 'tarea', 'tareas') : '',
      examenesManana ? plural(examenesManana, 'examen', 'exámenes') : '',
    ].filter(Boolean)

    if (partes.length) {
      avisos.push({
        clave: `manana:${manana}`,
        hora: ajustes.horaAvisosProximosEventos ?? '09:00',
        mensaje: {
          title: 'Mañana tienes cosas en tu agenda',
          body: partes.join(' y '),
          url: '#/calendario',
          tag: `manana-${manana}`,
        },
      })
    }
  }

  return avisos
}
