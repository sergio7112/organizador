import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Asignatura } from '../../domain/types'
import { PALETA } from '../../domain/types'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { Entrada } from '../ui/Campos'
import { SelectorColor } from '../ui/SelectorColor'

export function ModalAsignatura({
  abierto,
  onCerrar,
  asignatura,
}: {
  abierto: boolean
  onCerrar: () => void
  asignatura?: Asignatura | null
}) {
  const crearAsignatura = useAppStore((estado) => estado.crearAsignatura)
  const actualizarAsignatura = useAppStore((estado) => estado.actualizarAsignatura)
  const idFormulario = useId()

  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState<string>(PALETA[0].valor)

  useEffect(() => {
    if (!abierto) return
    setNombre(asignatura?.nombre ?? '')
    setColor(asignatura?.color ?? PALETA[0].valor)
  }, [abierto, asignatura])

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!nombre.trim()) return

    if (asignatura) {
      actualizarAsignatura(asignatura.id, { nombre: nombre.trim(), color })
    } else {
      crearAsignatura({ nombre: nombre.trim(), color })
    }
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={asignatura ? 'Editar asignatura' : 'Nueva asignatura'}
      descripcion="El color te ayudará a identificarla en tareas y exámenes."
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
        <Campo etiqueta="Nombre" htmlFor="asignatura-nombre" obligatorio>
          <Entrada
            id="asignatura-nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Ej. Matemáticas II"
            required
          />
        </Campo>
        <Campo etiqueta="Color">
          <SelectorColor valor={color} onChange={setColor} />
        </Campo>
      </form>
    </Modal>
  )
}
