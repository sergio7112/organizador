import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

/** Fecha de hoy en formato ISO corto (zona horaria local). */
export function hoyISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Convierte 'YYYY-MM-DD' en Date local (medianoche). */
export function aFecha(iso: string): Date {
  return parseISO(iso)
}

/** Convierte un Date local en 'YYYY-MM-DD'. */
export function isoDeFecha(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd')
}

export function sumarMeses(fecha: Date, meses: number): Date {
  return addMonths(fecha, meses)
}

export function sumarSemanas(fecha: Date, semanas: number): Date {
  return addWeeks(fecha, semanas)
}

export function sumarDias(iso: string, dias: number): string {
  return format(addDays(parseISO(iso), dias), 'yyyy-MM-dd')
}

/** Días que faltan (negativo si la fecha ya pasó). */
export function diasHasta(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date())
}

export function esHoy(iso: string): boolean {
  return isSameDay(parseISO(iso), new Date())
}

export function esAtrasada(iso: string): boolean {
  return diasHasta(iso) < 0
}

export function textoDias(iso: string): string {
  const dias = diasHasta(iso)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias === -1) return 'Ayer'
  if (dias > 1) return `En ${dias} días`
  return `Hace ${Math.abs(dias)} días`
}

/** "13 nov" */
export function fechaCorta(iso: string): string {
  return format(parseISO(iso), 'd MMM', { locale: es })
}

/** "vie, 13 nov" */
export function fechaCortaConDia(iso: string): string {
  return format(parseISO(iso), 'EEE, d MMM', { locale: es })
}

/** "viernes, 13 de noviembre" */
export function fechaLarga(iso: string): string {
  return format(parseISO(iso), "EEEE, d 'de' MMMM", { locale: es })
}

/** "noviembre de 2026" */
export function mesYAnio(fecha: Date): string {
  return format(fecha, "MMMM 'de' yyyy", { locale: es })
}

export function diasDeSemana(referencia: Date): Date[] {
  const inicio = startOfWeek(referencia, { weekStartsOn: 1 })
  const fin = endOfWeek(referencia, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: inicio, end: fin })
}

export function diasDeMes(referencia: Date): Date[] {
  const inicio = startOfMonth(referencia)
  const fin = endOfMonth(referencia)
  const inicioRejilla = startOfWeek(inicio, { weekStartsOn: 1 })
  const finRejilla = endOfWeek(fin, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: inicioRejilla, end: finRejilla })
}

export { isSameMonth, isSameDay }
