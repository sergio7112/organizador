import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Plus } from 'lucide-react'
import type { Asignatura } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { BarraProgreso } from '../components/ui/BarraProgreso'
import { Etiqueta } from '../components/ui/Etiquetas'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { ModalAsignatura } from '../components/subjects/ModalAsignatura'

export function PaginaAsignaturas() {
  const datos = useAppStore((estado) => estado.datos)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Asignatura | null>(null)

  const asignaturas = datos.asignaturas.slice().sort((a, b) => a.orden - b.orden)

  return (
    <>
      <CabeceraPagina
        titulo="Asignaturas"
        descripcion={`${asignaturas.length} asignaturas · ${datos.temas.length} temas en total`}
        accion={
          <Boton onClick={() => setModal(true)}>
            <Plus size={17} />
            Nueva asignatura
          </Boton>
        }
      />

      {asignaturas.length === 0 ? (
        <EstadoVacio
          icono={BookOpen}
          titulo="Todavía no hay asignaturas"
          descripcion="Crea tus asignaturas y añade el temario para controlar tu progreso."
          accion={
            <Boton onClick={() => setModal(true)}>
              <Plus size={16} />
              Crear asignatura
            </Boton>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {asignaturas.map((asignatura) => {
            const temas = datos.temas.filter(
              (tema) => tema.asignaturaId === asignatura.id,
            )
            const dominados = temas.filter((tema) => tema.estado === 'dominado').length
            const repasados = temas.filter((tema) => tema.estado === 'repasado').length
            const estudiando = temas.filter((tema) => tema.estado === 'estudiando').length
            const sinEmpezar = temas.filter((tema) => tema.estado === 'sin_empezar').length
            const porcentaje =
              temas.length === 0 ? 0 : Math.round((dominados / temas.length) * 100)
            const erroresAbiertos = datos.errores.filter(
              (error) =>
                !error.resuelto &&
                temas.some((tema) => tema.id === error.temaId),
            ).length

            return (
              <div key={asignatura.id} className="relative">
                <Link
                  to={`/asignaturas/${asignatura.id}`}
                  className="block h-full rounded-3xl focus-visible:outline-offset-4"
                >
                  <Tarjeta className="flex h-full flex-col p-4 hover:-translate-y-0.5 hover:border-[var(--primario)]/25 hover:shadow-[var(--sombra-elevada)]">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1.5 size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: asignatura.color }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{asignatura.nombre}</p>
                        <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                          {temas.length} {temas.length === 1 ? 'tema' : 'temas'} ·{' '}
                          {dominados} {dominados === 1 ? 'dominado' : 'dominados'}
                        </p>
                      </div>
                      <ChevronRight
                        size={17}
                        className="mt-0.5 shrink-0 text-[var(--texto-suave)]"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <BarraProgreso
                        valor={porcentaje}
                        etiqueta={`Temario dominado de ${asignatura.nombre}`}
                      />
                      <span className="w-9 text-right text-xs font-medium tabular-nums">
                        {porcentaje}%
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {estudiando > 0 && (
                        <Etiqueta tono="aviso">{estudiando} en estudio</Etiqueta>
                      )}
                      {repasados > 0 && (
                        <Etiqueta tono="primario">
                          {repasados} {repasados === 1 ? 'repasado' : 'repasados'}
                        </Etiqueta>
                      )}
                      {sinEmpezar > 0 && <Etiqueta>{sinEmpezar} sin empezar</Etiqueta>}
                      {erroresAbiertos > 0 && (
                        <Etiqueta tono="aviso">
                          {erroresAbiertos}{' '}
                          {erroresAbiertos === 1 ? 'error abierto' : 'errores abiertos'}
                        </Etiqueta>
                      )}
                      {temas.length === 0 && <Etiqueta>Sin temario</Etiqueta>}
                    </div>
                  </Tarjeta>
                </Link>
                <button
                  type="button"
                  onClick={() => setEditando(asignatura)}
                  className="absolute right-11 top-3.5 hidden rounded-lg px-2 py-1 text-xs text-[var(--texto-suave)] hover:bg-[var(--superficie-2)] sm:block"
                >
                  Editar
                </button>
              </div>
            )
          })}
        </div>
      )}

      <ModalAsignatura abierto={modal} onCerrar={() => setModal(false)} />
      <ModalAsignatura
        abierto={editando !== null}
        asignatura={editando}
        onCerrar={() => setEditando(null)}
      />
    </>
  )
}
