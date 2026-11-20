import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { EstadoTarea, Prioridad, Tarea } from '../../domain/types'
import {
  ESTADOS_TAREA,
  ETIQUETAS_ESTADO_TAREA,
  ETIQUETAS_PRIORIDAD,
  PRIORIDADES,
} from '../../domain/types'
import { hoyISO } from '../../domain/dates'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { AreaTexto, Entrada, Selector } from '../ui/Campos'

export function ModalTarea({
  abierto,
  onCerrar,
  tarea,
  asignaturaInicial,
  proyectoInicial,
}: {
  abierto: boolean
  onCerrar: () => void
  tarea?: Tarea | null
  asignaturaInicial?: string
  proyectoInicial?: string
}) {
  const datos = useAppStore((estado) => estado.datos)
  const crearTarea = useAppStore((estado) => estado.crearTarea)
  const actualizarTarea = useAppStore((estado) => estado.actualizarTarea)
  const idFormulario = useId()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaLimite, setFechaLimite] = useState(hoyISO())
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [estado, setEstado] = useState<EstadoTarea>('pendiente')
  const [vinculo, setVinculo] = useState('')

  useEffect(() => {
    if (!abierto) return
    setTitulo(tarea?.titulo ?? '')
    setDescripcion(tarea?.descripcion ?? '')
    setFechaLimite(tarea?.fechaLimite ?? hoyISO())
    setPrioridad(tarea?.prioridad ?? 'media')
    setEstado(tarea?.estado ?? 'pendiente')
    setVinculo(
      tarea?.vinculo
        ? `${tarea.vinculo.tipo}:${tarea.vinculo.id}`
        : asignaturaInicial
          ? `asignatura:${asignaturaInicial}`
          : proyectoInicial
            ? `proyecto:${proyectoInicial}`
            : '',
    )
  }, [abierto, tarea, asignaturaInicial, proyectoInicial])

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!titulo.trim()) return

    const [tipoVinculo, idVinculo] = vinculo.split(':')
    const entrada = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fechaLimite,
      prioridad,
      estado,
      vinculo:
        tipoVinculo === 'asignatura' || tipoVinculo === 'proyecto'
          ? ({ tipo: tipoVinculo, id: idVinculo } as const)
          : undefined,
    }

    if (tarea) actualizarTarea(tarea.id, entrada)
    else crearTarea(entrada)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tarea ? 'Editar tarea' : 'Nueva tarea'}
      descripcion="Las tareas se agrupan por fecha límite y prioridad."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form={idFormulario} disabled={!titulo.trim()}>
            Guardar
          </Boton>
        </>
      }
    >
      <form id={idFormulario} onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Título" htmlFor="tarea-titulo" obligatorio>
          <Entrada
            id="tarea-titulo"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Ej. Entregar los ejercicios de física"
            required
          />
        </Campo>

        <Campo etiqueta="Descripción" htmlFor="tarea-descripcion">
          <AreaTexto
            id="tarea-descripcion"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="Detalles opcionales"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Fecha límite" htmlFor="tarea-fecha" obligatorio>
            <Entrada
              id="tarea-fecha"
              type="date"
              value={fechaLimite}
              onChange={(evento) => setFechaLimite(evento.target.value)}
              required
            />
          </Campo>

          <Campo etiqueta="Prioridad" htmlFor="tarea-prioridad">
            <Selector
              id="tarea-prioridad"
              value={prioridad}
              onChange={(evento) => setPrioridad(evento.target.value as Prioridad)}
            >
              {PRIORIDADES.map((valor) => (
                <option key={valor} value={valor}>
                  {ETIQUETAS_PRIORIDAD[valor]}
                </option>
              ))}
            </Selector>
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Estado" htmlFor="tarea-estado">
            <Selector
              id="tarea-estado"
              value={estado}
              onChange={(evento) => setEstado(evento.target.value as EstadoTarea)}
            >
              {ESTADOS_TAREA.map((valor) => (
                <option key={valor} value={valor}>
                  {ETIQUETAS_ESTADO_TAREA[valor]}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Asignatura o proyecto" htmlFor="tarea-vinculo">
            <Selector
              id="tarea-vinculo"
              value={vinculo}
              onChange={(evento) => setVinculo(evento.target.value)}
            >
              <option value="">Sin vínculo</option>
              <optgroup label="Asignaturas">
                {datos.asignaturas
                  .slice()
                  .sort((a, b) => a.orden - b.orden)
                  .map((asignatura) => (
                    <option key={asignatura.id} value={`asignatura:${asignatura.id}`}>
                      {asignatura.nombre}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Proyectos">
                {datos.proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={`proyecto:${proyecto.id}`}>
                    {proyecto.nombre}
                  </option>
                ))}
              </optgroup>
            </Selector>
          </Campo>
        </div>
      </form>
    </Modal>
  )
}
