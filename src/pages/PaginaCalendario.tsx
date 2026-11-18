import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  aFecha,
  diasDeMes,
  diasDeSemana,
  fechaCortaConDia,
  fechaLarga,
  hoyISO,
  isoDeFecha,
  isSameDay,
  isSameMonth,
  mesYAnio,
  sumarMeses,
  sumarSemanas,
} from '../domain/dates'
import { agruparPorFecha, eventosCalendario } from '../domain/calendar'
import { useAppStore } from '../store/useAppStore'
import { cn, capitalizar } from '../lib/format'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Selector } from '../components/ui/Campos'
import { ControlSegmentado } from '../components/ui/ControlSegmentado'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { FilaEvento } from '../components/calendar/FilaEvento'

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const OPCIONES_VISTA = [
  { valor: 'mes' as const, etiqueta: 'Mes' },
  { valor: 'semana' as const, etiqueta: 'Semana' },
]

export function PaginaCalendario() {
  const datos = useAppStore((estado) => estado.datos)
  const cambiarAjustes = useAppStore((estado) => estado.cambiarAjustes)

  const hoy = hoyISO()
  const [referencia, setReferencia] = useState(() => aFecha(hoy))
  const [seleccionada, setSeleccionada] = useState(hoy)
  const [asignaturaId, setAsignaturaId] = useState<'todas' | string>('todas')

  const vista = datos.ajustes.vistaCalendario

  const eventos = useMemo(() => {
    const todos = eventosCalendario(datos)
    return asignaturaId === 'todas'
      ? todos
      : todos.filter((evento) => evento.asignaturaId === asignaturaId)
  }, [datos, asignaturaId])

  const porFecha = useMemo(() => agruparPorFecha(eventos), [eventos])
  const dias = vista === 'mes' ? diasDeMes(referencia) : diasDeSemana(referencia)

  const eventosSeleccionados = porFecha.get(seleccionada) ?? []
  const fechaHoy = useMemo(() => aFecha(hoy), [hoy])

  const nombresAsignatura = useMemo(
    () => new Map(datos.asignaturas.map((a) => [a.id, a.nombre])),
    [datos.asignaturas],
  )

  const mover = (direccion: -1 | 1) => {
    setReferencia((actual) =>
      vista === 'mes' ? sumarMeses(actual, direccion) : sumarSemanas(actual, direccion),
    )
  }

  const irHoy = () => {
    setReferencia(aFecha(hoy))
    setSeleccionada(hoy)
  }

  const etiquetaRango = () => {
    if (vista === 'mes') return mesYAnio(referencia)
    const inicio = dias[0]
    const fin = dias[dias.length - 1]
    return `${fechaCortaConDia(isoDeFecha(inicio))} – ${fechaCortaConDia(isoDeFecha(fin))}`
  }

  return (
    <>
      <CabeceraPagina
        titulo="Calendario"
        descripcion="Exámenes y entregas de un vistazo"
      />

      <Tarjeta className="mb-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Boton
              variante="fantasma"
              tamano="icono"
              onClick={() => mover(-1)}
              aria-label={vista === 'mes' ? 'Mes anterior' : 'Semana anterior'}
              className="size-9"
            >
              <ChevronLeft size={18} />
            </Boton>
            <p className="min-w-44 text-center text-sm font-semibold">
              {capitalizar(etiquetaRango())}
            </p>
            <Boton
              variante="fantasma"
              tamano="icono"
              onClick={() => mover(1)}
              aria-label={vista === 'mes' ? 'Mes siguiente' : 'Semana siguiente'}
              className="size-9"
            >
              <ChevronRight size={18} />
            </Boton>
            <Boton variante="secundario" tamano="sm" onClick={irHoy} className="ml-1">
              Hoy
            </Boton>
          </div>

          <ControlSegmentado
            ariaLabel="Vista del calendario"
            valor={vista}
            opciones={OPCIONES_VISTA}
            onChange={(nueva) => cambiarAjustes({ vistaCalendario: nueva })}
          />
        </div>

        <div className="mt-3">
          <Selector
            aria-label="Filtrar el calendario por asignatura"
            value={asignaturaId}
            onChange={(evento) => setAsignaturaId(evento.target.value)}
            className="h-10 text-sm"
          >
            <option value="todas">Todas las asignaturas</option>
            {datos.asignaturas
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((asignatura) => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </option>
              ))}
          </Selector>
        </div>
      </Tarjeta>

      {vista === 'mes' ? (
        <Tarjeta className="mb-4 p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="pb-1 text-center text-[11px] font-medium text-[var(--texto-suave)]"
              >
                {dia}
              </div>
            ))}

            {dias.map((dia) => {
              const iso = isoDeFecha(dia)
              const eventosDia = porFecha.get(iso) ?? []
              const fueraDelMes = !isSameMonth(dia, referencia)
              const esHoyDia = isSameDay(dia, fechaHoy)
              const activo = iso === seleccionada

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSeleccionada(iso)}
                  aria-label={`${fechaLarga(iso)}${
                    eventosDia.length > 0
                      ? `, ${eventosDia.length} ${eventosDia.length === 1 ? 'evento' : 'eventos'}`
                      : ', sin eventos'
                  }`}
                  aria-pressed={activo}
                  className={cn(
                    'flex h-14 min-w-0 flex-col items-center gap-1 overflow-hidden rounded-lg border px-0.5 pt-1 transition-colors sm:h-20 sm:items-start sm:px-1.5',
                    fueraDelMes
                      ? 'border-transparent text-[var(--texto-suave)] opacity-45'
                      : 'border-transparent text-[var(--texto)] hover:bg-[var(--superficie-2)]',
                    activo && 'border-[var(--primario)] bg-[var(--primario-suave)]',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums',
                      esHoyDia && 'bg-[var(--primario)] text-[var(--primario-contraste)]',
                    )}
                  >
                    {dia.getDate()}
                  </span>
                  <span className="flex flex-wrap items-center justify-center gap-0.5 sm:justify-start">
                    {eventosDia.slice(0, 4).map((evento) => (
                      <span
                        key={evento.id}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: evento.color }}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="hidden w-full flex-col gap-0.5 sm:flex">
                    {eventosDia.slice(0, 2).map((evento) => (
                      <span
                        key={evento.id}
                        className="truncate rounded px-1 text-left text-[10px] leading-4"
                        style={{
                          backgroundColor: `${evento.color}1f`,
                          color: evento.color,
                        }}
                      >
                        {evento.titulo}
                      </span>
                    ))}
                    {eventosDia.length > 2 && (
                      <span className="px-1 text-[10px] text-[var(--texto-suave)]">
                        +{eventosDia.length - 2} más
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </Tarjeta>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {dias.map((dia) => {
            const iso = isoDeFecha(dia)
            const eventosDia = porFecha.get(iso) ?? []
            const esHoyDia = isSameDay(dia, fechaHoy)

            return (
              <Tarjeta key={iso} className="p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      esHoyDia && 'text-[var(--primario)]',
                    )}
                  >
                    {capitalizar(fechaCortaConDia(iso))}
                  </p>
                  {esHoyDia && <span className="text-[11px] font-medium text-[var(--primario)]">Hoy</span>}
                </div>
                {eventosDia.length === 0 ? (
                  <p className="py-1 text-xs text-[var(--texto-suave)]">Sin eventos</p>
                ) : (
                  <div className="-mx-2 flex flex-col">
                    {eventosDia.map((evento) => (
                      <FilaEvento
                        key={evento.id}
                        evento={evento}
                        nombreAsignatura={nombresAsignatura.get(evento.asignaturaId ?? '')}
                      />
                    ))}
                  </div>
                )}
              </Tarjeta>
            )
          })}
        </div>
      )}

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold">
          {capitalizar(fechaLarga(seleccionada))}
        </h2>
        <Tarjeta className="p-2">
          {eventosSeleccionados.length === 0 ? (
            <EstadoVacio
              icono={CalendarDays}
              titulo="Sin eventos este día"
              descripcion="Selecciona otro día o añade una tarea o un examen."
            />
          ) : (
            <div className="flex flex-col">
              {eventosSeleccionados.map((evento) => (
                <FilaEvento
                  key={evento.id}
                  evento={evento}
                  nombreAsignatura={nombresAsignatura.get(evento.asignaturaId ?? '')}
                />
              ))}
            </div>
          )}
        </Tarjeta>
      </section>
    </>
  )
}
