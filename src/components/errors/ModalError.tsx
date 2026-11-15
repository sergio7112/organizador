import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { AreaTexto, Selector } from '../ui/Campos'

export function ModalError({
  abierto,
  onCerrar,
  temaInicial,
}: {
  abierto: boolean
  onCerrar: () => void
  temaInicial?: string
}) {
  const datos = useAppStore((estado) => estado.datos)
  const crearError = useAppStore((estado) => estado.crearError)
  const idFormulario = useId()

  const [asignaturaId, setAsignaturaId] = useState('')
  const [temaId, setTemaId] = useState('')
  const [queFallo, setQueFallo] = useState('')
  const [porQue, setPorQue] = useState('')

  useEffect(() => {
    if (!abierto) return
    const tema = temaInicial
      ? datos.temas.find((item) => item.id === temaInicial)
      : undefined
    const asignatura =
      tema?.asignaturaId ??
      datos.asignaturas.slice().sort((a, b) => a.orden - b.orden)[0]?.id ??
      ''
    const primero = datos.temas
      .filter((item) => item.asignaturaId === asignatura)
      .sort((a, b) => a.orden - b.orden)[0]
    setAsignaturaId(asignatura)
    setTemaId(tema?.id ?? primero?.id ?? '')
    setQueFallo('')
    setPorQue('')
  }, [abierto, temaInicial, datos.temas, datos.asignaturas])

  const temas = datos.temas
    .filter((tema) => tema.asignaturaId === asignaturaId)
    .sort((a, b) => a.orden - b.orden)

  const cambiarAsignatura = (nuevoId: string) => {
    setAsignaturaId(nuevoId)
    const primero = datos.temas
      .filter((tema) => tema.asignaturaId === nuevoId)
      .sort((a, b) => a.orden - b.orden)[0]
    setTemaId(primero?.id ?? '')
  }

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!temaId || !queFallo.trim()) return
    crearError({
      temaId,
      queFallo: queFallo.trim(),
      porQue: porQue.trim(),
    })
    onCerrar()
  }

  const valido = temaId !== '' && queFallo.trim() !== ''

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nuevo error"
      descripcion="Anotar qué falló y por qué te ayuda a no repetirlo."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form={idFormulario} disabled={!valido}>
            Guardar
          </Boton>
        </>
      }
    >
      <form id={idFormulario} onSubmit={guardar} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Asignatura" htmlFor="error-asignatura">
            <Selector
              id="error-asignatura"
              value={asignaturaId}
              onChange={(evento) => cambiarAsignatura(evento.target.value)}
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

          <Campo etiqueta="Tema" htmlFor="error-tema" obligatorio>
            <Selector
              id="error-tema"
              value={temaId}
              onChange={(evento) => setTemaId(evento.target.value)}
              disabled={temas.length === 0}
            >
              {temas.length === 0 && <option value="">Sin temas</option>}
              {temas.map((tema) => (
                <option key={tema.id} value={tema.id}>
                  {tema.titulo}
                </option>
              ))}
            </Selector>
          </Campo>
        </div>

        <Campo etiqueta="¿Qué falló?" htmlFor="error-que" obligatorio>
          <AreaTexto
            id="error-que"
            value={queFallo}
            onChange={(evento) => setQueFallo(evento.target.value)}
            placeholder="Ej. Me equivoqué en el signo del trabajo."
            autoFocus
            required
          />
        </Campo>

        <Campo
          etiqueta="¿Por qué falló?"
          htmlFor="error-porque"
          ayuda="Opcional, pero es la parte que más ayuda a mejorar."
        >
          <AreaTexto
            id="error-porque"
            value={porQue}
            onChange={(evento) => setPorQue(evento.target.value)}
            placeholder="Ej. No comprobé la dirección del desplazamiento."
          />
        </Campo>
      </form>
    </Modal>
  )
}
