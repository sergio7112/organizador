import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { Boton } from '../components/ui/Boton'

export function PaginaNoEncontrada() {
  return (
    <div className="mx-auto max-w-md py-10">
      <EstadoVacio
        icono={Compass}
        titulo="Página no encontrada"
        descripcion="La dirección no existe o el contenido se ha movido."
        accion={
          <Link to="/hoy">
            <Boton>Ir a Hoy</Boton>
          </Link>
        }
      />
    </div>
  )
}
