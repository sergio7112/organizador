import { Modal } from './Modal'
import { Boton } from './Boton'

export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Eliminar',
  peligro = true,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean
  titulo: string
  mensaje: string
  textoConfirmar?: string
  peligro?: boolean
  onConfirmar: () => void
  onCerrar: () => void
}) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={peligro ? 'peligro' : 'primario'}
            onClick={() => {
              onConfirmar()
              onCerrar()
            }}
          >
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <p className="text-sm text-[var(--texto-suave)]">{mensaje}</p>
    </Modal>
  )
}
