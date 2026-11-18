import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Proyecto } from '../../domain/types'
import { PALETA } from '../../domain/types'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { AreaTexto, Entrada } from '../ui/Campos'
import { SelectorColor } from '../ui/SelectorColor'

export function ModalProyecto({
  abierto,
  onCerrar,
  proyecto,
}: {
  abierto: boolean
  onCerrar: () => void
  proyecto?: Proyecto | null
}) {
  const crearProyecto = useAppStore((estado) => estado.crearProyecto)
  const actualizarProyecto = useAppStore((estado) => estado.actualizarProyecto)
  const idFormulario = useId()

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [color, setColor] = useState<string>(PALETA[4].valor)

  useEffect(() => {
    if (!abierto) return
    setNombre(proyecto?.nombre ?? '')
    setDescripcion(proyecto?.descripcion ?? '')
    setColor(proyecto?.color ?? PALETA[4].valor)
  }, [abierto, proyecto])

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!nombre.trim()) return

    if (proyecto) {
      actualizarProyecto(proyecto.id, {
        nombre: nombre.trim(),
        color,
        descripcion: descripcion.trim() || undefined,
      })
    } else {
      crearProyecto({
        nombre: nombre.trim(),
        color,
        ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
        notasMarkdown: '',
      })
    }
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={proyecto ? 'Editar proyecto' : 'Nuevo proyecto'}
      descripcion="Un espacio para tus planes, con checklist y notas."
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form={idFormulario} disabled={!nombre.trim()}>
            Guardar
          </Boton>
        </>
      }
    >
      <form id={idFormulario} onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre" htmlFor="proyecto-nombre" obligatorio>
          <Entrada
            id="proyecto-nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Ej. Preparar la selectividad"
            autoFocus
            required
          />
        </Campo>

        <Campo etiqueta="Descripción" htmlFor="proyecto-descripcion">
          <AreaTexto
            id="proyecto-descripcion"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="¿Para qué es este proyecto?"
          />
        </Campo>

        <Campo etiqueta="Color">
          <SelectorColor valor={color} onChange={setColor} />
        </Campo>
      </form>
    </Modal>
  )
}
