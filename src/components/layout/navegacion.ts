import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  FolderKanban,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Settings,
  Sun,
} from 'lucide-react'

export interface Seccion {
  ruta: string
  nombre: string
  icono: LucideIcon
  enMovil: boolean
}

export const SECCIONES: Seccion[] = [
  { ruta: '/hoy', nombre: 'Hoy', icono: Sun, enMovil: true },
  { ruta: '/asignaturas', nombre: 'Asignaturas', icono: BookOpen, enMovil: true },
  { ruta: '/examenes', nombre: 'Exámenes', icono: GraduationCap, enMovil: false },
  { ruta: '/tareas', nombre: 'Tareas', icono: ListChecks, enMovil: true },
  { ruta: '/calendario', nombre: 'Calendario', icono: CalendarDays, enMovil: true },
  { ruta: '/proyectos', nombre: 'Proyectos', icono: FolderKanban, enMovil: true },
  { ruta: '/repaso', nombre: 'Repaso', icono: RotateCcw, enMovil: false },
  { ruta: '/errores', nombre: 'Errores', icono: AlertTriangle, enMovil: false },
]

export const SECCION_AJUSTES: Seccion = {
  ruta: '/ajustes',
  nombre: 'Ajustes',
  icono: Settings,
  enMovil: false,
}

export function seccionDeRuta(pathname: string): Seccion | undefined {
  const todas = [...SECCIONES, SECCION_AJUSTES]
  return todas.find(
    (seccion) => pathname === seccion.ruta || pathname.startsWith(`${seccion.ruta}/`),
  )
}
