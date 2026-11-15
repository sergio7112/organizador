export type EstadoTema = 'sin_empezar' | 'estudiando' | 'repasado' | 'dominado'
export type Prioridad = 'alta' | 'media' | 'baja'
export type EstadoTarea = 'pendiente' | 'en_curso' | 'hecha'
export type TemaOscuro = 'claro' | 'oscuro' | 'sistema'
export type VistaCalendario = 'semana' | 'mes'

export interface Asignatura {
  id: string
  nombre: string
  color: string
  orden: number
  creadaEn: string
}

export interface Tema {
  id: string
  asignaturaId: string
  titulo: string
  estado: EstadoTema
  nota?: number
  orden: number
  actualizadoEn: string
}

export interface Examen {
  id: string
  asignaturaId: string
  titulo: string
  fecha: string
  temaIds: string[]
  notas?: string
  creadoEn: string
}

export interface VinculoTarea {
  tipo: 'asignatura' | 'proyecto'
  id: string
}

export interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  fechaLimite: string
  prioridad: Prioridad
  vinculo?: VinculoTarea
  estado: EstadoTarea
  creadaEn: string
  completadaEn?: string
}

export interface Proyecto {
  id: string
  nombre: string
  descripcion?: string
  color: string
  notasMarkdown: string
  creadoEn: string
}

export interface ItemChecklist {
  id: string
  proyectoId: string
  texto: string
  hecho: boolean
  orden: number
}

export interface Repaso {
  id: string
  temaId: string
  fecha: string
  intervaloDias: 1 | 3 | 7
  programadoEn: string
  completadoEn?: string
}

export interface ErrorTema {
  id: string
  temaId: string
  queFallo: string
  porQue: string
  fecha: string
  resuelto: boolean
}

export interface Ajustes {
  tema: TemaOscuro
  vistaCalendario: VistaCalendario
}

export interface Datos {
  version: number
  asignaturas: Asignatura[]
  temas: Tema[]
  examenes: Examen[]
  tareas: Tarea[]
  proyectos: Proyecto[]
  checklist: ItemChecklist[]
  repasos: Repaso[]
  errores: ErrorTema[]
  ajustes: Ajustes
}

export const VERSION_DATOS = 1

export const ESTADOS_TEMA: EstadoTema[] = [
  'sin_empezar',
  'estudiando',
  'repasado',
  'dominado',
]

export const ETIQUETAS_ESTADO_TEMA: Record<EstadoTema, string> = {
  sin_empezar: 'Sin empezar',
  estudiando: 'Estudiando',
  repasado: 'Repasado',
  dominado: 'Dominado',
}

export const ORDEN_ESTADO_TEMA: Record<EstadoTema, number> = {
  sin_empezar: 0,
  estudiando: 1,
  repasado: 2,
  dominado: 3,
}

export const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja']

export const ETIQUETAS_PRIORIDAD: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

export const PESO_PRIORIDAD: Record<Prioridad, number> = {
  alta: 0,
  media: 1,
  baja: 2,
}

export const ESTADOS_TAREA: EstadoTarea[] = ['pendiente', 'en_curso', 'hecha']

export const ETIQUETAS_ESTADO_TAREA: Record<EstadoTarea, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  hecha: 'Hecha',
}

/** Paleta cálida, en sintonía con el rojo principal de la app. */
export const PALETA = [
  { nombre: 'Rojo', valor: '#e60023' },
  { nombre: 'Granate', valor: '#9f1239' },
  { nombre: 'Cereza', valor: '#c2185b' },
  { nombre: 'Rosa', valor: '#db2777' },
  { nombre: 'Coral', valor: '#f0616d' },
  { nombre: 'Terracota', valor: '#c2410c' },
  { nombre: 'Naranja', valor: '#ea580c' },
  { nombre: 'Ámbar', valor: '#d97706' },
  { nombre: 'Mostaza', valor: '#a16207' },
  { nombre: 'Ciruela', valor: '#86198f' },
  { nombre: 'Piedra', valor: '#78716c' },
] as const
