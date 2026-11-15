import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { EstadoTema, Tema } from '../../domain/types'
import {
  ESTADOS_TEMA,
  ETIQUETAS_ESTADO_TEMA,
} from '../../domain/types'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { Entrada, Selector } from '../ui/Campos'

export function ModalTema({
  abierto,
  onCerrar,
  asignaturaId,
  tema,
}: {
  abierto: boolean
  onCerrar: () => void
  asignaturaId: string
  tema?: Tema | null
}) {
  const crearTema = useAppStore((estado) => estado.crearTema)
  const actualizarTema = useAppStore((estado) => estado.actualizarTema)
  const idFormulario = useId()

  const [titulo, setTitulo] = useState('')
  const [estado, setEstado] = useState<EstadoTema>('sin_empezar')
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (!abierto) return
    setTitulo(tema?.titulo ?? '')
    setEstado(tema?.estado ?? 'sin_empezar')
    setNota(tema?.nota !== undefined ? String(tema.nota) : '')
  }, [abierto, tema])

  const notaNumero = nota.trim() === '' ? undefined : Number(nota)
  const notaValida =
    notaNumero === undefined ||
    (Number.isFinite(notaNumero) && notaNumero >= 0 && notaNumero <= 10)

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!titulo.trim() || !notaValida) return

    if (tema) {
      actualizarTema(tema.id, {
        titulo: titulo.trim(),
        estado,
        nota: notaNumero,
      })
    } else {
      const id = crearTema({ asignaturaId, titulo: titulo.trim() })
      if (estado !== 'sin_empezar' || notaNumero !== undefined) {
        actualizarTema(id, { estado, nota: notaNumero })
      }
    }
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tema ? 'Editar tema' : 'Nuevo tema'}
      descripcion="La nota es opcional. Al pasar a «Estudiando» se programan repasos."
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form={idFormulario} disabled={!titulo.trim() || !notaValida}>
            Guardar
          </Boton>
        </>
      }
    >
      <form id={idFormulario} onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Título del tema" htmlFor="tema-titulo" obligatorio>
          <Entrada
            id="tema-titulo"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Ej. Campo gravitatorio"
            autoFocus
            required
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Estado" htmlFor="tema-estado">
            <Selector
              id="tema-estado"
              value={estado}
              onChange={(evento) => setEstado(evento.target.value as EstadoTema)}
            >
              {ESTADOS_TEMA.map((valor) => (
                <option key={valor} value={valor}>
                  {ETIQUETAS_ESTADO_TEMA[valor]}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo
            etiqueta="Nota"
            htmlFor="tema-nota"
            ayuda={notaValida ? 'Entre 0 y 10, opcional.' : 'La nota debe estar entre 0 y 10.'}
          >
            <Entrada
              id="tema-nota"
              type="number"
              inputMode="decimal"
              min={0}
              max={10}
              step={0.1}
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
              placeholder="Sin nota"
              aria-invalid={!notaValida}
            />
          </Campo>
        </div>
      </form>
    </Modal>
  )
}
