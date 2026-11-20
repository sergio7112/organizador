import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Settings } from 'lucide-react'
import { Logotipo } from '../ui/Logotipo'
import { MenuMovil } from './MenuMovil'

export function CabeceraMovil() {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setAbierto(false)
  }, [pathname])

  const cerrar = useCallback(() => setAbierto(false), [])

  return (
    <>
      <header className="sticky top-0 z-30 grid min-h-14 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 border-b border-[var(--borde)] bg-[var(--fondo)] px-3 pt-safe md:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          className="grid size-10 place-items-center rounded-xl text-[var(--texto-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--texto)] active:bg-[var(--superficie-2)]"
        >
          <Menu size={22} />
        </button>

        <Link
          to="/hoy"
          className="flex min-w-0 items-center justify-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <Logotipo className="size-8 shrink-0" />
          <span className="truncate">Organizador</span>
        </Link>

        <Link
          to="/ajustes"
          aria-label="Ajustes"
          className="grid size-10 place-items-center justify-self-end rounded-xl text-[var(--texto-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--texto)]"
        >
          <Settings size={20} />
        </Link>
      </header>

      <MenuMovil abierto={abierto} onCerrar={cerrar} />
    </>
  )
}
