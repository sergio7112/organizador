import { useMemo, useState } from 'react'
import { Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import { Tarjeta } from '../ui/Tarjeta'
import { Boton } from '../ui/Boton'
import { DialogoConfirmacion } from '../ui/DialogoConfirmacion'
import { Etiqueta } from '../ui/Etiquetas'
import { formatearFechaCorta, formatearHora } from '../../domain/dates'
import type { SesionEstudio, Asignatura } from '../../domain/types'
import { ModalSesionEstudio } from './ModalSesionEstudio'

interface ListaSesionesEstudioProps {
  sesiones: SesionEstudio[]
  asignaturas: Asignatura[]
  onCrear: (datos: Omit<SesionEstudio, 'id' | 'creadoEn' | 'duracionMinutos'>) => void
  onActualizar: (id: string, cambios: Partial<Omit<SesionEstudio, 'id' | 'creadoEn' | 'duracionMinutos'>>) => void
  onEliminar: (id: string) => void
}

function formatearDuracion(minutos: number): string {
  if (minutos >= 60) {
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return `${minutos}min`
}

export function ListaSesionesEstudio({
  sesiones,
  asignaturas,
  onCrear,
  onActualizar,
  onEliminar,
}: ListaSesionesEstudioProps) {
  const [sesionEditando, setSesionEditando] = useState<SesionEstudio | null>(null)
  const [sesionEliminando, setSesionEliminando] = useState<SesionEstudio | null>(null)
  const [filtroAsignatura, setFiltroAsignatura] = useState<string>('todas')
  const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc')
  const [agrupado, setAgrupado] = useState(true)

  const sesionesFiltradas = useMemo(() => {
    let resultado = [...sesiones]
    if (filtroAsignatura !== 'todas') {
      resultado = resultado.filter((s) => s.asignaturaId === filtroAsignatura)
    }
    resultado.sort((a, b) => {
      const fechaA = a.fecha + 'T' + a.inicio
      const fechaB = b.fecha + 'T' + b.inicio
      return ordenFecha === 'desc' ? fechaB.localeCompare(fechaA) : fechaA.localeCompare(fechaB)
    })
    return resultado
  }, [sesiones, filtroAsignatura, ordenFecha])

  const sesionesAgrupadas = useMemo(() => {
    if (!agrupado) return [{ fecha: 'Todas', items: sesionesFiltradas }]
    const grupos: Record<string, SesionEstudio[]> = {}
    for (const sesion of sesionesFiltradas) {
      if (!grupos[sesion.fecha]) grupos[sesion.fecha] = []
      grupos[sesion.fecha].push(sesion)
    }
    return Object.entries(grupos)
      .sort(([a], [b]) => (ordenFecha === 'desc' ? b.localeCompare(a) : a.localeCompare(b)))
      .map(([fecha, items]) => ({ fecha, items }))
  }, [sesionesFiltradas, agrupado, ordenFecha])

  const totalMinutos = useMemo(
    () => sesionesFiltradas.reduce((sum, s) => sum + s.duracionMinutos, 0),
    [sesionesFiltradas],
  )

  if (sesiones.length === 0) {
    return (
      <Tarjeta className="py-12 text-center">
        <p className="text-[var(--texto-suave)] mb-4">
          No tienes sesiones de estudio registradas. Añade tu primera sesión para empezar a trackear tu tiempo.
        </p>
        <Boton onClick={() => setSesionEditando({} as SesionEstudio)}>Registrar sesión</Boton>
      </Tarjeta>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Controles */}
      <Tarjeta className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--texto-suave)]">
              Total: <strong className="text-[var(--texto)]">{formatearDuracion(totalMinutos)}</strong>
            </span>
          </div>

          <select
            value={filtroAsignatura}
            onChange={(e) => setFiltroAsignatura(e.target.value)}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2 text-sm"
            aria-label="Filtrar por asignatura"
          >
            <option value="todas">Todas las asignaturas</option>
            {asignaturas.map((a) => (
              <option key={a.id} value={a.id} style={{ color: a.color }}>
                {a.nombre}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setOrdenFecha((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-[var(--texto-suave)] hover:bg-[var(--superficie-2)] transition-colors"
              aria-label={ordenFecha === 'desc' ? 'Más antiguas primero' : 'Más recientes primero'}
            >
              {ordenFecha === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setAgrupado((a) => !a)}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-[var(--texto-suave)] hover:bg-[var(--superficie-2)] transition-colors"
              aria-pressed={agrupado}
              aria-label={agrupado ? 'Desagrupar por fecha' : 'Agrupar por fecha'}
            >
              {agrupado ? 'Agrupado' : 'Lista'}
            </button>
          </div>
        </div>
      </Tarjeta>

      {/* Lista */}
      <div className="grid gap-3" role="list" aria-label="Sesiones de estudio">
        {sesionesAgrupadas.map(({ fecha, items }) => (
          <div key={fecha} className="grid gap-3">
            {agrupado && (
              <div className="flex items-center gap-3 px-1">
                <div className="h-0.5 flex-1 bg-[var(--borde)]" />
                <span className="text-sm font-medium text-[var(--texto-suave)] whitespace-nowrap">
                  {fecha === 'Todas' ? 'Todas las sesiones' : formatearFechaCorta(fecha)}
                </span>
                <div className="h-0.5 flex-1 bg-[var(--borde)]" />
              </div>
            )}

            {items.map((sesion) => {
              const asignatura = asignaturas.find((a) => a.id === sesion.asignaturaId)
              return (
                <div key={sesion.id} role="listitem">
                  <Tarjeta className="relative group flex items-center gap-3 p-3">
                    {asignatura && (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: asignatura.color }}
                    >
                      <Etiqueta tono="exito" className="text-sm">
                        {formatearDuracion(sesion.duracionMinutos)}
                      </Etiqueta>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {asignatura && (
                        <Etiqueta tono="neutro">{asignatura.nombre}</Etiqueta>
                      )}
                      <span className="text-sm text-[var(--texto-suave)]">
                        {formatearHora(sesion.inicio)} - {formatearHora(sesion.fin)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      {sesion.notas && (
                        <span className="text-[var(--texto-suave)] truncate max-w-xs">{sesion.notas}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSesionEditando(sesion)}
                      className="p-2 rounded-xl text-[var(--texto-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--texto)] transition-colors"
                      aria-label="Editar sesión"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSesionEliminando(sesion)}
                      className="p-2 rounded-xl text-[var(--texto-suave)] hover:bg-[var(--peligro-suave)] hover:text-[var(--peligro)] transition-colors"
                      aria-label="Eliminar sesión"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Tarjeta>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Modal crear/editar */}
      <ModalSesionEstudio
        abierto={!!sesionEditando}
        onCerrar={() => setSesionEditando(null)}
        onGuardar={(datos) =>
          sesionEditando?.id ? onActualizar(sesionEditando.id, datos) : onCrear(datos)
        }
        sesionExistente={sesionEditando?.id ? sesionEditando : undefined}
        asignaturas={asignaturas}
      />

      {/* Diálogo confirmar eliminación */}
      <DialogoConfirmacion
        abierto={!!sesionEliminando}
        onCerrar={() => setSesionEliminando(null)}
        onConfirmar={() => {
          if (sesionEliminando) onEliminar(sesionEliminando.id)
          setSesionEliminando(null)
        }}
        titulo="Eliminar sesión de estudio"
        mensaje={`¿Seguro que quieres eliminar la sesión del ${formatearFechaCorta(sesionEliminando?.fecha ?? '')}?` }
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}