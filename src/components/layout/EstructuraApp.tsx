import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BarraLateral } from './BarraLateral'
import { CabeceraMovil } from './CabeceraMovil'
import { seccionDeRuta } from './navegacion'

export function EstructuraApp() {
  const { pathname } = useLocation()
  const seccion = seccionDeRuta(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    document.title = seccion ? `${seccion.nombre} · Organizador` : 'Organizador'
  }, [seccion])

  return (
    <div className="min-h-dvh md:flex">
      <BarraLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <CabeceraMovil />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-pagina md:px-8 md:pb-12 md:pt-9">
          <div key={pathname} className="animar-panel">
            <Suspense
              fallback={
                <p className="text-sm text-[var(--texto-suave)]">Cargando…</p>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
