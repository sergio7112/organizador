export type EstadoTema = 'sin_empezar' | 'estudiando' | 'repasado' | 'dominado'
export type Prioridad = 'alta' | 'media' | 'baja'
export type EstadoTarea = 'pendiente' | 'en_curso' | 'hecha'
export type TemaOscuro = 'claro' | 'oscuro' | 'sistema'
export type VistaCalendario = 'semana' | 'mes'
export type FrecuenciaHabito = 'diaria' | 'semanal' | 'mensual' | 'personalizada'
export type PeriodoEstadistica = 'dia' | 'semana' | 'mes' | 'año' | 'todo'

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
  sincronizacionAutomatica: boolean
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

/** Paleta equilibrada, en sintonía con el azul tinta de la app. */
export const PALETA = [
  { nombre: 'Azul tinta', valor: '#1f4e79' },
  { nombre: 'Verde pino', valor: '#2f7a52' },
  { nombre: 'Terracota', valor: '#b45309' },
  { nombre: 'Mostaza', valor: '#a16207' },
  { nombre: 'Ciruela', valor: '#6b4c8a' },
  { nombre: 'Rosa', valor: '#be185d' },
  { nombre: 'Cian', valor: '#0e7490' },
  { nombre: 'Índigo', valor: '#4338ca' },
  { nombre: 'Granate', valor: '#9f1239' },
  { nombre: 'Piedra', valor: '#57534e' },
  { nombre: 'Ámbar', valor: '#ca8a04' },
] as const

// ==================== HÁBITOS ====================

export interface Habito {
  id: string
  nombre: string
  descripcion?: string
  color: string
  frecuencia: FrecuenciaHabito
  /** Días de la semana (0-6) para frecuencia 'semanal' o 'personalizada' */
  diasSemana?: number[]
  /** Día del mes (1-31) para frecuencia 'mensual' */
  diaMes?: number
  objetivo?: number // Para hábitos con contador (ej: leer 20 páginas)
  unidad?: string // Unidad del objetivo (páginas, vasos, km, etc.)
  archivado: boolean
  creadoEn: string
  orden: number
}

export interface RegistroHabito {
  id: string
  habitoId: string
  fecha: string // YYYY-MM-DD
  completado: boolean
  valor?: number // Valor numérico si el hábito tiene objetivo
  nota?: string
  creadoEn: string
}

export type EntradaHabito = Omit<Habito, 'id' | 'creadoEn' | 'orden' | 'archivado'>
export type EntradaRegistroHabito = Omit<RegistroHabito, 'id' | 'creadoEn'>

// ==================== TIEMPO DE ESTUDIO ====================

export interface SesionEstudio {
  id: string
  asignaturaId: string
  fecha: string // YYYY-MM-DD
  inicio: string // HH:mm
  fin: string // HH:mm
  duracionMinutos: number
  notas?: string
  creadoEn: string
}

export type EntradaSesionEstudio = Omit<SesionEstudio, 'id' | 'creadoEn' | 'duracionMinutos'>

// ==================== DATOS GLOBALES ====================

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
  habitos: Habito[]
  registrosHabitos: RegistroHabito[]
  sesionesEstudio: SesionEstudio[]
  ajustes: Ajustes
}
