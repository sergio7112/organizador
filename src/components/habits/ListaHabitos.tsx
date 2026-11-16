import { useEffect, useMemo, useState } from 'react'
import { Trash2, Archive, GripVertical, Target } from 'lucide-react'
import { cn } from '../../lib/format'
import { Tarjeta } from '../ui/Tarjeta'
import { Boton } from '../ui/Boton'
import { DialogoConfirmacion } from '../ui/DialogoConfirmacion'
import { Etiqueta } from '../ui/Etiquetas'
import { hoyISO, isoDeFecha, sumarDias } from '../../domain/dates'
import type { Habito, RegistroHabito } from '../../domain/types'
import { ModalHabito } from './ModalHabito'

interface ListaHabitosProps {
  habitos: Habito[]
  registros: RegistroHabito[]
  onCrear: (habito: Omit<Habito, 'id' | 'creadoEn' | 'orden' | 'archivado'>) => void
  onActualizar: (id: string, cambios: Partial<Habito>) => void
  onEliminar: (id: string) => void
  onArchivar: (id: string, archivado: boolean) => void
  onReordenar: (ids: string[]) => void
  onAlternarRegistro: (habitoId: string, fecha: string) => void
  /** Se incrementa desde la cabecera para abrir el formulario de creación. */
  solicitudNueva?: number
  /** Avisa a la página de que la solicitud ya se ha atendido. */
  onSolicitudAtendida?: () => void
}

const FRECUENCIA_ETIQUETAS: Record<Habito['frecuencia'], string> = {
  diaria: 'Diaria',
  semanal: 'Semanal',
  mensual: 'Mensual',
  personalizada: 'Personalizada',
}

function calcularRacha(habito: Habito, registros: RegistroHabito[], fechaFin: string = hoyISO()): number {
  const registrosHabito = registros
    .filter((r) => r.habitoId === habito.id && r.completado)
    .map((r) => r.fecha)
    .sort()
    .reverse()

  if (registrosHabito.length === 0) return 0

  let racha = 0
  let fechaActual = fechaFin

  for (const fechaRegistro of registrosHabito) {
    if (fechaRegistro === fechaActual) {
      racha++
      fechaActual = sumarDias(fechaActual, -1)
    } else if (fechaRegistro < fechaActual) {
      break
    }
  }

  return racha
}

function calcularProgresoSemanal(habito: Habito, registros: RegistroHabito[]): { completados: number; total: number } {
  const hoy = new Date(`${hoyISO()}T00:00:00`)
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)) // Lunes
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 6)

  let diasEsperados = 0
  const registrosSet = new Set(
    registros
      .filter((r) => r.habitoId === habito.id && r.completado)
      .map((r) => r.fecha),
  )

  for (let d = new Date(inicioSemana); d <= finSemana; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay()

    let seEspera = false
    switch (habito.frecuencia) {
      case 'diaria':
        seEspera = true
        break
      case 'semanal':
        seEspera = habito.diasSemana?.includes(diaSemana) ?? false
        break
      case 'mensual':
        seEspera = habito.diaMes === d.getDate()
        break
      case 'personalizada':
        seEspera = habito.diasSemana?.includes(diaSemana) ?? false
        break
    }

    if (seEspera) {
      diasEsperados++
    }
  }

  let completados = 0
  for (let d = new Date(inicioSemana); d <= finSemana; d.setDate(d.getDate() + 1)) {
    if (registrosSet.has(isoDeFecha(d))) completados++
  }

  return { completados: Math.min(completados, diasEsperados), total: diasEsperados }
}

export function ListaHabitos({
  habitos,
  registros,
  onCrear,
  onActualizar,
  onEliminar,
  onArchivar,
  onReordenar,
  onAlternarRegistro,
  solicitudNueva = 0,
  onSolicitudAtendida,
}: ListaHabitosProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null)
  const [habitoEliminando, setHabitoEliminando] = useState<Habito | null>(null)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)

  const abrirNuevo = () => {
    setHabitoEditando(null)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setHabitoEditando(null)
  }

  useEffect(() => {
    if (solicitudNueva > 0) {
      setHabitoEditando(null)
      setModalAbierto(true)
      onSolicitudAtendida?.()
    }
  }, [solicitudNueva, onSolicitudAtendida])

  const habitosActivos = useMemo(
    () => habitos.filter((h) => !h.archivado).sort((a, b) => a.orden - b.orden),
    [habitos],
  )
  const habitosArchivados = useMemo(
    () => habitos.filter((h) => h.archivado).sort((a, b) => a.orden - b.orden),
    [habitos],
  )

  const coloresAsignados = habitos.map((h) => h.color)

  const manejarArrastreInicio = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.currentTarget.classList.add('opacity-50')
  }

  const manejarArrastreFin = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50')
  }

  const manejarArrastreSobre = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const manejarSoltar = (e: React.DragEvent<HTMLDivElement>, idDestino: string) => {
    e.stopPropagation()
    const idOrigen = e.dataTransfer.getData('text/plain')
    if (idOrigen && idOrigen !== idDestino) {
      const ids = habitosActivos.map((h) => h.id)
      const indiceOrigen = ids.indexOf(idOrigen)
      const indiceDestino = ids.indexOf(idDestino)
      if (indiceOrigen >= 0 && indiceDestino >= 0) {
        const nuevosIds = [...ids]
        const [eliminado] = nuevosIds.splice(indiceOrigen, 1)
        nuevosIds.splice(indiceDestino, 0, eliminado)
        onReordenar(nuevosIds)
      }
    }
    e.currentTarget.classList.remove('opacity-50')
  }

  return (
    <div className="grid gap-4">
      {/* Hábitos activos */}
      {habitosActivos.length > 0 && (
        <section aria-label="Hábitos activos">
          <div
            className="grid gap-3"
            role="list"
            aria-label="Lista de hábitos"
            onDragOver={manejarArrastreSobre}
            onDrop={(e) => {
              e.preventDefault()
              const idOrigen = e.dataTransfer.getData('text/plain')
              const ids = habitosActivos.map((h) => h.id)
              const indiceOrigen = ids.indexOf(idOrigen)
              if (indiceOrigen >= 0) {
                const nuevosIds = [...ids]
                const [eliminado] = nuevosIds.splice(indiceOrigen, 1)
                nuevosIds.push(eliminado)
                onReordenar(nuevosIds)
              }
            }}
          >
            {habitosActivos.map((habito) => {
              const { completados, total } = calcularProgresoSemanal(habito, registros)
              const racha = calcularRacha(habito, registros)
              const registroHoy = registros.find(
                (r) => r.habitoId === habito.id && r.fecha === hoyISO(),
              )
              const completadoHoy = registroHoy?.completado ?? false

              return (
                <div
                  key={habito.id}
                  className="relative group"
                  draggable
                  onDragStart={(e) => manejarArrastreInicio(e, habito.id)}
                  onDragEnd={manejarArrastreFin}
                  onDragOver={manejarArrastreSobre}
                  onDrop={(e) => manejarSoltar(e, habito.id)}
                >
                  <Tarjeta className="flex w-full items-start gap-3 p-4">
                    <button
                      type="button"
                      className="mt-1 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-xl bg-[var(--superficie-2)] text-[var(--texto-suave)] transition-colors hover:bg-[var(--borde)] active:cursor-grabbing"
                      onClick={() => setMenuAbierto(menuAbierto === habito.id ? null : habito.id)}
                      aria-label="Más opciones"
                      aria-expanded={menuAbierto === habito.id}
                    >
                      <GripVertical size={16} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: habito.color }}
                        >
                          <Target size={18} className="text-white/90" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{habito.nombre}</h3>
                          {habito.descripcion && (
                            <p className="text-sm text-[var(--texto-suave)] truncate">{habito.descripcion}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--texto-suave)]">
                            <Etiqueta tono="neutro">{FRECUENCIA_ETIQUETAS[habito.frecuencia]}</Etiqueta>
                            {habito.objetivo && (
                              <Etiqueta tono="exito">
                                Objetivo: {habito.objetivo}
                                {habito.unidad ? ` ${habito.unidad}` : ''}
                              </Etiqueta>
                            )}
                            {total > 0 && (
                              <span className="flex items-center gap-1">
                                Progreso semanal: <strong>{completados}/{total}</strong>
                              </span>
                            )}
                            {racha > 0 && (
                              <span className="flex items-center gap-1 text-[var(--exito)]">
                                🔥 Racha: <strong>{racha}</strong> días
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón de completar hoy */}
                      {(habito.frecuencia !== 'mensual' || new Date().getDate() === (habito.diaMes ?? 0)) && (
                        <button
                          type="button"
                          onClick={() => onAlternarRegistro(habito.id, hoyISO())}
                          className={cn(
                            'mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                            completadoHoy
                              ? 'bg-[var(--exito-suave)] text-[var(--exito)]'
                              : 'bg-[var(--superficie-2)] text-[var(--texto)] hover:bg-[var(--borde)]',
                          )}
                          aria-pressed={completadoHoy}
                        >
                          {completadoHoy ? '✓ Completado hoy' : 'Marcar como hecho hoy'}
                        </button>
                      )}
                    </div>

                    {/* Menú contextual */}
                    {menuAbierto === habito.id && (
                      <div className="absolute right-4 top-4 z-10">
                        <div className="rounded-xl border border-[var(--borde)] bg-[var(--superficie)] shadow-xl p-1 min-w-[160px]">
                          <button
                            type="button"
                            onClick={() => {
                              setHabitoEditando(habito)
                              setModalAbierto(true)
                              setMenuAbierto(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--texto)] hover:bg-[var(--superficie-2)]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHabitoEliminando(habito)
                              setMenuAbierto(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--peligro)] hover:bg-[var(--peligro-suave)]"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onArchivar(habito.id, true)
                              setMenuAbierto(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--texto)] hover:bg-[var(--superficie-2)]"
                          >
                            <Archive size={14} /> Archivar
                          </button>
                        </div>
                      </div>
                    )}
                  </Tarjeta>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Hábitos archivados */}
      {habitosArchivados.length > 0 && (
        <section className="border-t border-[var(--borde)] pt-4" aria-label="Hábitos archivados">
          <h3 className="mb-3 text-sm font-medium text-[var(--texto-suave)]">Archivados</h3>
          <div className="grid gap-3">
            {habitosArchivados.map((habito) => (
              <Tarjeta
                key={habito.id}
                className="flex items-center gap-3 p-3 opacity-60"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: habito.color }}
                >
                  <Target size={15} className="text-white/90" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{habito.nombre}</h4>
                  <p className="text-xs text-[var(--texto-suave)]">
                    {FRECUENCIA_ETIQUETAS[habito.frecuencia]}
                    {habito.objetivo
                      ? ` · Objetivo: ${habito.objetivo}${habito.unidad ? ` ${habito.unidad}` : ''}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onArchivar(habito.id, false)}
                  className="text-sm text-[var(--primario)] hover:underline"
                >
                  Desarchivar
                </button>
              </Tarjeta>
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {habitos.length === 0 && (
        <Tarjeta className="py-12 text-center">
          <p className="text-[var(--texto-suave)] mb-4">
            Aún no tienes hábitos. Crea el primero para empezar a construir rachas.
          </p>
          <Boton onClick={abrirNuevo}>Crear primer hábito</Boton>
        </Tarjeta>
      )}

      {/* Modal crear/editar */}
      <ModalHabito
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        onGuardar={(datos) => {
          if (habitoEditando) {
            onActualizar(habitoEditando.id, datos)
          } else {
            onCrear(datos)
          }
        }}
        habitoExistente={habitoEditando ?? undefined}
        coloresAsignados={coloresAsignados}
      />

      {/* Diálogo confirmar eliminación */}
      <DialogoConfirmacion
        abierto={!!habitoEliminando}
        onCerrar={() => setHabitoEliminando(null)}
        onConfirmar={() => {
          if (habitoEliminando) onEliminar(habitoEliminando.id)
          setHabitoEliminando(null)
        }}
        titulo="Eliminar hábito"
        mensaje={`¿Seguro que quieres eliminar "${habitoEliminando?.nombre}"? Se borrarán también todos sus registros.`}
        textoConfirmar="Eliminar"
        peligro
      />
    </div>
  )
}
