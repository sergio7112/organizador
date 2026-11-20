import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Examen } from '../../domain/types'
import { hoyISO, sumarDias } from '../../domain/dates'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { AreaTexto, Entrada, Selector } from '../ui/Campos'
import { EtiquetaEstadoTema } from '../ui/Etiquetas'

export function ModalExamen({
  abierto,
  onCerrar,
  examen,
  asignaturaInicial,
}: {
  abierto: boolean
  onCerrar: () => void
  examen?: Examen | null
  asignaturaInicial?: string
}) {
  const datos = useAppStore((estado) => estado.datos)
  const crearExamen = useAppStore((estado) => estado.crearExamen)
  const actualizarExamen = useAppStore((estado) => estado.actualizarExamen)
  const idFormulario = useId()

  const [titulo, setTitulo] = useState('')
  const [asignaturaId, setAsignaturaId] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [temaIds, setTemaIds] = useState<string[]>([])
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (!abierto) return
    const inicial =
      examen?.asignaturaId ?? asignaturaInicial ?? datos.asignaturas[0]?.id ?? ''
    setTitulo(examen?.titulo ?? '')
    setAsignaturaId(inicial)
    setFecha(examen?.fecha ?? sumarDias(hoyISO(), 7))
    setNotas(examen?.notas ?? '')
    setTemaIds(
      examen?.temaIds.filter(
        (id) => datos.temas.find((tema) => tema.id === id)?.asignaturaId === inicial,
      ) ?? [],
    )
    // Solo se reinicia al abrir el modal o cambiar de examen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, examen, asignaturaInicial])

  const temasDisponibles = datos.temas
    .filter((tema) => tema.asignaturaId === asignaturaId)
    .sort((a, b) => a.orden - b.orden)

  const cambiarAsignatura = (nuevoId: string) => {
    setAsignaturaId(nuevoId)
    setTemaIds((seleccionados) =>
      seleccionados.filter(
        (id) => datos.temas.find((tema) => tema.id === id)?.asignaturaId === nuevoId,
      ),
    )
  }

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!titulo.trim() || !asignaturaId || !fecha) return

    const entrada = {
      titulo: titulo.trim(),
      asignaturaId,
      fecha,
      temaIds,
      notas: notas.trim() || undefined,
    }

    if (examen) actualizarExamen(examen.id, entrada)
    else crearExamen(entrada)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={examen ? 'Editar examen' : 'Nuevo examen'}
      descripcion="Marca los temas que entran para calcular tu progreso."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            type="submit"
            form={idFormulario}
            disabled={!titulo.trim() || !asignaturaId || !fecha}
          >
            Guardar
          </Boton>
        </>
      }
    >
      <form id={idFormulario} onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Título" htmlFor="examen-titulo" obligatorio>
          <Entrada
            id="examen-titulo"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Ej. Campos gravitatorio y eléctrico"
            required
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Asignatura" htmlFor="examen-asignatura" obligatorio>
            <Selector
              id="examen-asignatura"
              value={asignaturaId}
              onChange={(evento) => cambiarAsignatura(evento.target.value)}
              required
            >
              {datos.asignaturas.length === 0 && (
                <option value="">Sin asignaturas</option>
              )}
              {datos.asignaturas
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((asignatura) => (
                  <option key={asignatura.id} value={asignatura.id}>
                    {asignatura.nombre}
                  </option>
                ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Fecha" htmlFor="examen-fecha" obligatorio>
            <Entrada
              id="examen-fecha"
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              required
            />
          </Campo>
        </div>

        <Campo
          etiqueta={`Temas que entran (${temaIds.length})`}
          ayuda="El porcentaje dominado se calcula solo con estos temas."
        >
          <div className="rounded-xl border border-[var(--borde)]">
            <div className="flex items-center justify-between border-b border-[var(--borde)] px-3 py-2">
              <span className="text-xs text-[var(--texto-suave)]">
                {temasDisponibles.length} temas disponibles
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--primario)] hover:underline"
                  onClick={() => setTemaIds(temasDisponibles.map((tema) => tema.id))}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--texto-suave)] hover:underline"
                  onClick={() => setTemaIds([])}
                >
                  Ninguno
                </button>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto overscroll-contain p-1.5">
              {temasDisponibles.length === 0 ? (
                <p className="px-2 py-3 text-sm text-[var(--texto-suave)]">
                  Esta asignatura todavía no tiene temas.
                </p>
              ) : (
                temasDisponibles.map((tema) => {
                  const marcado = temaIds.includes(tema.id)
                  return (
                    <label
                      key={tema.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--superficie-2)]"
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={(evento) =>
                          setTemaIds((seleccionados) =>
                            evento.target.checked
                              ? [...seleccionados, tema.id]
                              : seleccionados.filter((id) => id !== tema.id),
                          )
                        }
                        className="size-4 shrink-0 accent-[var(--primario)]"
                      />
                      <span className="min-w-0 flex-1 truncate">{tema.titulo}</span>
                      <EtiquetaEstadoTema estado={tema.estado} />
                    </label>
                  )
                })
              )}
            </div>
          </div>
        </Campo>

        <Campo etiqueta="Notas" htmlFor="examen-notas">
          <AreaTexto
            id="examen-notas"
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
            placeholder="Qué entra, qué repasar, material permitido…"
          />
        </Campo>
      </form>
    </Modal>
  )
}
