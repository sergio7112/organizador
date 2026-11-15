import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Flame,
  GraduationCap,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fechaCorta, fechaLarga, hoyISO, textoDias } from '../domain/dates'
import { progresoExamen, proximoExamen } from '../domain/exams'
import {
  repasosParaHoy,
  sugerenciaDeEstudio,
  tareasDeHoy,
  temasEnEstudio,
} from '../domain/today'
import { useAppStore } from '../store/useAppStore'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { BarraProgreso } from '../components/ui/BarraProgreso'
import { Etiqueta, EtiquetaEstadoTema, PuntoColor } from '../components/ui/Etiquetas'
import { FilaRepaso } from '../components/reviews/FilaRepaso'
import { ModalAsignatura } from '../components/subjects/ModalAsignatura'
import { ListaTareas } from '../components/tasks/ListaTareas'
import { ModalTarea } from '../components/tasks/ModalTarea'

function Dato({
  icono: Icono,
  valor,
  etiqueta,
  tono,
}: {
  icono: LucideIcon
  valor: number
  etiqueta: string
  tono: 'primario' | 'peligro' | 'aviso'
}) {
  const estilos = {
    primario: {
      icono: 'text-[var(--primario)] bg-[var(--primario-suave)]',
      fondo:
        'linear-gradient(135deg, var(--primario-suave), var(--superficie) 72%)',
    },
    peligro: {
      icono: 'text-[var(--peligro)] bg-[var(--peligro-suave)]',
      fondo:
        'linear-gradient(135deg, var(--peligro-suave), var(--superficie) 72%)',
    },
    aviso: {
      icono: 'text-[var(--aviso)] bg-[var(--aviso-suave)]',
      fondo:
        'linear-gradient(135deg, var(--aviso-suave), var(--superficie) 72%)',
    },
  }
  return (
    <Tarjeta
      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
      style={{ backgroundImage: estilos[tono].fondo }}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${estilos[tono].icono}`}
      >
        <Icono size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-none tabular-nums">{valor}</p>
        <p className="mt-1 text-[11px] leading-tight text-[var(--texto-suave)] sm:text-xs">
          {etiqueta}
        </p>
      </div>
    </Tarjeta>
  )
}

export function PaginaHoy() {
  const datos = useAppStore((estado) => estado.datos)
  const actualizarTema = useAppStore((estado) => estado.actualizarTema)
  const completarRepaso = useAppStore((estado) => estado.completarRepaso)
  const [modalTarea, setModalTarea] = useState(false)
  const [modalAsignatura, setModalAsignatura] = useState(false)

  const hoy = hoyISO()
  const tareas = tareasDeHoy(datos.tareas, hoy)
  const atrasadas = tareas.filter((tarea) => tarea.fechaLimite < hoy)
  const temasEstudiando = temasEnEstudio(datos.temas)
  const enEstudio = temasEstudiando.slice(0, 5)
  const fecha = fechaLarga(hoy)
  const repasos = repasosParaHoy(datos, hoy)
  const examen = proximoExamen(datos.examenes, hoy)
  const progreso = examen ? progresoExamen(examen, datos.temas) : null
  const examenAsignatura = examen
    ? datos.asignaturas.find((item) => item.id === examen.asignaturaId)
    : undefined
  const sugerencia = sugerenciaDeEstudio(datos, hoy)

  return (
    <>
      <CabeceraPagina
        titulo="Hoy"
        descripcion={fecha.charAt(0).toUpperCase() + fecha.slice(1)}
        accion={
          <Boton onClick={() => setModalTarea(true)}>
            <Plus size={17} />
            Nueva tarea
          </Boton>
        }
      />

      {datos.asignaturas.length === 0 && (
        <Tarjeta
          className="mb-6 overflow-hidden p-5 sm:p-6"
          style={{
            backgroundImage:
              'linear-gradient(135deg, var(--primario-suave), var(--superficie) 72%)',
          }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--primario)] text-[var(--primario-contraste)]"
              style={{
                boxShadow:
                  '0 8px 24px color-mix(in srgb, var(--primario) 25%, transparent)',
              }}
            >
              <GraduationCap size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Empieza tu curso
              </h2>
              <p className="mt-1 text-sm text-[var(--texto-suave)]">
                Crea tu primera asignatura para organizar el temario, los
                exámenes y el repaso.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Boton onClick={() => setModalAsignatura(true)}>
                <Plus size={16} />
                Crear asignatura
              </Boton>
              <Boton variante="secundario" onClick={() => setModalTarea(true)}>
                <Plus size={16} />
                Añadir tarea
              </Boton>
            </div>
          </div>
        </Tarjeta>
      )}

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <Dato icono={CalendarClock} valor={tareas.length} etiqueta="Para hoy" tono="primario" />
        <Dato icono={Flame} valor={atrasadas.length} etiqueta="Atrasadas" tono="peligro" />
        <Dato
          icono={RotateCcw}
          valor={repasos.length}
          etiqueta="Repasos"
          tono="aviso"
        />
      </div>

      {examen && progreso && (
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Siguiente examen</h2>
            <Link
              to="/examenes"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
            >
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </div>
          <Link to="/examenes" className="block">
            <Tarjeta className="p-4 hover:-translate-y-0.5 hover:border-[var(--primario)]/25 hover:shadow-[var(--sombra-elevada)]">
              <div className="flex items-start gap-3">
                <span className="mt-1.5">
                  <PuntoColor color={examenAsignatura?.color ?? 'var(--primario)'} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug line-clamp-2">{examen.titulo}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--texto-suave)]">
                    {examenAsignatura?.nombre ?? 'Asignatura eliminada'} ·{' '}
                    {fechaCorta(examen.fecha)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--primario)]">
                    {textoDias(examen.fecha)}
                  </p>
                  <Etiqueta
                    tono={progreso.dominados === progreso.total ? 'exito' : 'neutro'}
                  >
                    {progreso.porcentajeDominado}% dominado
                  </Etiqueta>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <BarraProgreso
                  valor={progreso.porcentajeDominado}
                  etiqueta={`Temario dominado de ${examen.titulo}`}
                />
                <span className="w-16 shrink-0 text-right text-xs text-[var(--texto-suave)]">
                  {progreso.dominados}/{progreso.total} temas
                </span>
              </div>
            </Tarjeta>
          </Link>
        </section>
      )}

      {repasos.length > 0 && (
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Repasos pendientes</h2>
            <Link
              to="/repaso"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
            >
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </div>
          <Tarjeta className="overflow-hidden">
            <ul className="divide-y divide-[var(--borde)]">
              {repasos.slice(0, 4).map(({ repaso, tema, asignatura }) => (
                <FilaRepaso
                  key={repaso.id}
                  repaso={repaso}
                  tema={tema}
                  asignatura={asignatura}
                  onCompletar={() => completarRepaso(repaso.id)}
                />
              ))}
            </ul>
          </Tarjeta>
          {repasos.length > 4 && (
            <Link
              to="/repaso"
              className="mt-2 inline-flex items-center gap-1 px-1 text-xs font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
            >
              Y {repasos.length - 4} más
              <ArrowRight size={13} />
            </Link>
          )}
        </section>
      )}

      {sugerencia && (
        <section className="mb-7">
          <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold">
            <Sparkles size={16} className="text-[var(--primario)]" />
            Sugerencia de estudio
          </h2>
          <Tarjeta className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primario-suave)] text-[var(--primario)]">
                <GraduationCap size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{sugerencia.tema.titulo}</p>
                <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                  {sugerencia.asignatura?.nombre ?? 'Asignatura'} ·{' '}
                  {sugerencia.repasoPendiente
                    ? 'tiene un repaso pendiente'
                    : sugerencia.examen.fecha === hoy
                      ? 'el examen es hoy'
                      : `quedan ${sugerencia.diasRestantes} días para «${sugerencia.examen.titulo}»`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <EtiquetaEstadoTema estado={sugerencia.tema.estado} />
                  {sugerencia.repasoPendiente && (
                    <Etiqueta tono="aviso">Repaso pendiente</Etiqueta>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sugerencia.tema.estado === 'sin_empezar' ? (
                <Boton
                  tamano="sm"
                  onClick={() =>
                    actualizarTema(sugerencia.tema.id, { estado: 'estudiando' })
                  }
                >
                  <Play size={15} />
                  Empezar tema
                </Boton>
              ) : (
                <Link
                  to={`/asignaturas/${sugerencia.tema.asignaturaId}`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--primario)] px-3 text-sm font-medium text-[var(--primario-contraste)] transition-colors hover:brightness-110"
                >
                  <BookOpen size={15} />
                  Ir al temario
                </Link>
              )}
              <Link
                to={`/asignaturas/${sugerencia.tema.asignaturaId}`}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--borde)] px-3 text-sm font-medium text-[var(--texto)] transition-colors hover:bg-[var(--superficie-2)]"
              >
                Ver tema
              </Link>
            </div>
          </Tarjeta>
        </section>
      )}

      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Tareas de hoy y atrasadas</h2>
          <Link
            to="/tareas"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
          >
            Ver todas
            <ArrowRight size={14} />
          </Link>
        </div>
        <ListaTareas
          tareas={tareas}
          accionVacio={
            <Boton variante="secundario" onClick={() => setModalTarea(true)}>
              <Plus size={16} />
              Añadir tarea
            </Boton>
          }
        />
      </section>

      {enEstudio.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Temas en estudio</h2>
            <Link
              to="/asignaturas"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
            >
              Ver asignaturas
              <ArrowRight size={14} />
            </Link>
          </div>
          <Tarjeta className="overflow-hidden">
            <ul className="divide-y divide-[var(--borde)]">
              {enEstudio.map((tema) => {
                const asignatura = datos.asignaturas.find(
                  (item) => item.id === tema.asignaturaId,
                )
                return (
                  <li key={tema.id}>
                    <Link
                      to={`/asignaturas/${tema.asignaturaId}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--superficie-2)]"
                    >
                      <PuntoColor color={asignatura?.color ?? 'var(--primario)'} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{tema.titulo}</p>
                        <p className="truncate text-xs text-[var(--texto-suave)]">
                          {asignatura?.nombre ?? 'Asignatura'}
                        </p>
                      </div>
                      <EtiquetaEstadoTema estado={tema.estado} />
                      <ChevronRight size={16} className="shrink-0 text-[var(--texto-suave)]" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Tarjeta>
        </section>
      )}

      <ModalAsignatura
        abierto={modalAsignatura}
        onCerrar={() => setModalAsignatura(false)}
      />
      <ModalTarea abierto={modalTarea} onCerrar={() => setModalTarea(false)} />
    </>
  )
}
