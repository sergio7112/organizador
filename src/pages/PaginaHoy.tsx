import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { aFecha, diasDeSemana, fechaLarga, hoyISO, isoDeFecha } from '../domain/dates'
import { habitosDeHoy } from '../domain/habits'
import { tareasDeHoy } from '../domain/today'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/format'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Logotipo } from '../components/ui/Logotipo'
import { ModalAsignatura } from '../components/subjects/ModalAsignatura'
import { ListaTareas } from '../components/tasks/ListaTareas'
import { ModalTarea } from '../components/tasks/ModalTarea'

function TituloSeccion({
  children,
  cuenta,
  tono = 'neutro',
  enlace,
}: {
  children: string
  cuenta?: number
  tono?: 'neutro' | 'peligro'
  enlace?: { ruta: string; texto: string }
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        {children}
        {cuenta !== undefined && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
              tono === 'peligro'
                ? 'bg-[var(--peligro-suave)] text-[var(--peligro)]'
                : 'bg-[var(--superficie-2)] text-[var(--texto-suave)]',
            )}
          >
            {cuenta}
          </span>
        )}
      </h2>
      {enlace && (
        <Link
          to={enlace.ruta}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--texto-suave)] hover:text-[var(--texto)]"
        >
          {enlace.texto}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

export function PaginaHoy() {
  const datos = useAppStore((estado) => estado.datos)
  const alternarRegistroHabito = useAppStore((estado) => estado.alternarRegistroHabito)
  const [modalTarea, setModalTarea] = useState(false)
  const [modalAsignatura, setModalAsignatura] = useState(false)

  const hoy = hoyISO()
  const fecha = fechaLarga(hoy)

  const habitos = habitosDeHoy(datos, hoy)
  const registrosHoy = datos.registrosHabitos.filter((registro) => registro.fecha === hoy)
  const habitosHechos = habitos.filter((habito) =>
    registrosHoy.some((registro) => registro.habitoId === habito.id && registro.completado),
  ).length

  const pendientes = tareasDeHoy(datos.tareas, hoy)
  const atrasadas = pendientes.filter((tarea) => tarea.fechaLimite < hoy)
  const paraHoy = pendientes.filter((tarea) => tarea.fechaLimite === hoy)

  const semana = diasDeSemana(aFecha(hoy))
  const restoDeSemana = semana
    .map((dia) => {
      const iso = isoDeFecha(dia)
      return {
        iso,
        tareas: tareasDeHoy(datos.tareas, iso).filter((tarea) => tarea.fechaLimite === iso),
      }
    })
    .filter((grupo) => grupo.iso > hoy)

  const diasConTareas = restoDeSemana.filter((grupo) => grupo.tareas.length > 0)

  const accionVacio = (
    <Boton variante="secundario" onClick={() => setModalTarea(true)}>
      <Plus size={16} />
      Añadir tarea
    </Boton>
  )

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
            <Logotipo className="size-12 shrink-0" />
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

      {/* Hábitos: solo marcar los de hoy */}
      {(habitos.length > 0 || datos.habitos.some((habito) => !habito.archivado)) && (
        <section className="mb-6">
          <TituloSeccion
            cuenta={habitos.length > 0 ? habitosHechos : undefined}
            enlace={{ ruta: '/habitos', texto: 'Ver hábitos' }}
          >
            Hábitos de hoy
          </TituloSeccion>

          {habitos.length === 0 ? (
            <p className="text-sm text-[var(--texto-suave)]">
              Hoy no toca ningún hábito.
            </p>
          ) : (
            <Tarjeta className="overflow-hidden">
              <ul className="divide-y divide-[var(--borde)]">
                {habitos.map((habito) => {
                  const hecho =
                    registrosHoy.find((registro) => registro.habitoId === habito.id)
                      ?.completado ?? false

                  return (
                    <li key={habito.id}>
                      <button
                        type="button"
                        onClick={() => alternarRegistroHabito(habito.id, hoy)}
                        aria-pressed={hecho}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--superficie-2)]"
                      >
                        <span
                          className={cn(
                            'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                            hecho
                              ? 'border-[var(--exito)] bg-[var(--exito)] text-white'
                              : 'border-[var(--borde)] text-transparent',
                          )}
                        >
                          <Check size={14} strokeWidth={3} />
                        </span>
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: habito.color }}
                          aria-hidden="true"
                        />
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-sm',
                            hecho
                              ? 'text-[var(--texto-suave)] line-through'
                              : 'font-medium',
                          )}
                        >
                          {habito.nombre}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Tarjeta>
          )}
        </section>
      )}

      {atrasadas.length > 0 && (
        <section className="mb-6">
          <TituloSeccion cuenta={atrasadas.length} tono="peligro">
            Atrasadas
          </TituloSeccion>
          <ListaTareas tareas={atrasadas} />
        </section>
      )}

      <section className="mb-6">
        <TituloSeccion
          cuenta={paraHoy.length}
          enlace={{ ruta: '/tareas', texto: 'Ver todas' }}
        >
          Para hoy
        </TituloSeccion>
        <ListaTareas tareas={paraHoy} accionVacio={accionVacio} />
      </section>

      <section>
        <TituloSeccion enlace={{ ruta: '/calendario', texto: 'Calendario' }}>
          Esta semana
        </TituloSeccion>

        <Tarjeta className="mb-3 p-2">
          <div className="grid grid-cols-7 gap-1">
            {semana.map((dia) => {
              const iso = isoDeFecha(dia)
              const esHoyDia = iso === hoy
              const cuantas = tareasDeHoy(datos.tareas, iso).filter(
                (tarea) => tarea.fechaLimite === iso,
              ).length

              return (
                <div
                  key={iso}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl px-1 py-2',
                    esHoyDia
                      ? 'bg-[var(--primario-suave)] text-[var(--primario)]'
                      : 'text-[var(--texto)]',
                  )}
                  aria-label={`${format(dia, "EEEE d 'de' MMMM", { locale: es })}: ${
                    cuantas === 0
                      ? 'sin tareas'
                      : `${cuantas} ${cuantas === 1 ? 'tarea' : 'tareas'}`
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--texto-suave)]">
                    {format(dia, 'EEEEE', { locale: es })}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {format(dia, 'd')}
                  </span>
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      cuantas > 0
                        ? esHoyDia
                          ? 'bg-[var(--primario)]'
                          : 'bg-[var(--primario)]/50'
                        : 'bg-transparent',
                    )}
                    aria-hidden="true"
                  />
                </div>
              )
            })}
          </div>
        </Tarjeta>

        {diasConTareas.length === 0 ? (
          <p className="text-sm text-[var(--texto-suave)]">
            No hay más tareas esta semana.
          </p>
        ) : (
          <div className="grid gap-4">
            {diasConTareas.map(({ iso, tareas }) => (
              <div key={iso}>
                <h3 className="mb-2 px-1 text-sm font-semibold">
                  {format(aFecha(iso), "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <ListaTareas tareas={tareas} />
              </div>
            ))}
          </div>
        )}
      </section>

      <ModalAsignatura
        abierto={modalAsignatura}
        onCerrar={() => setModalAsignatura(false)}
      />
      <ModalTarea abierto={modalTarea} onCerrar={() => setModalTarea(false)} />
    </>
  )
}
