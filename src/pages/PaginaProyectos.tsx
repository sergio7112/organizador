import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, FolderKanban, Plus } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { BarraProgreso } from '../components/ui/BarraProgreso'
import { Etiqueta } from '../components/ui/Etiquetas'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { ModalProyecto } from '../components/projects/ModalProyecto'

export function PaginaProyectos() {
  const datos = useAppStore((estado) => estado.datos)
  const [modal, setModal] = useState(false)

  const proyectos = useMemo(
    () =>
      datos.proyectos
        .slice()
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    [datos.proyectos],
  )

  const totalPasos = datos.checklist.length
  const pasosHechos = datos.checklist.filter((item) => item.hecho).length

  return (
    <>
      <CabeceraPagina
        titulo="Proyectos"
        descripcion={
          proyectos.length === 0
            ? 'Tus planes personales, con checklist y notas'
            : `${proyectos.length} ${proyectos.length === 1 ? 'proyecto' : 'proyectos'} · ${pasosHechos} de ${totalPasos} pasos completados`
        }
        accion={
          <Boton onClick={() => setModal(true)}>
            <Plus size={17} />
            Nuevo proyecto
          </Boton>
        }
      />

      {proyectos.length === 0 ? (
        <EstadoVacio
          icono={FolderKanban}
          titulo="Todavía no hay proyectos"
          descripcion="Crea un proyecto para organizar sus pasos y guardar notas en Markdown."
          accion={
            <Boton onClick={() => setModal(true)}>
              <Plus size={16} />
              Crear proyecto
            </Boton>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {proyectos.map((proyecto) => {
            const items = datos.checklist.filter(
              (item) => item.proyectoId === proyecto.id,
            )
            const hechos = items.filter((item) => item.hecho).length
            const porcentaje =
              items.length === 0 ? 0 : Math.round((hechos / items.length) * 100)
            const tareas = datos.tareas.filter(
              (tarea) =>
                tarea.vinculo?.tipo === 'proyecto' &&
                tarea.vinculo.id === proyecto.id &&
                tarea.estado !== 'hecha',
            ).length

            return (
              <Link
                key={proyecto.id}
                to={`/proyectos/${proyecto.id}`}
                className="block rounded-3xl focus-visible:outline-offset-4"
              >
                <Tarjeta className="flex h-full flex-col p-4 hover:-translate-y-0.5 hover:border-[var(--primario)]/25 hover:shadow-[var(--sombra-elevada)]">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1.5 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: proyecto.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{proyecto.nombre}</p>
                      {proyecto.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--texto-suave)]">
                          {proyecto.descripcion}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={17}
                      className="mt-0.5 shrink-0 text-[var(--texto-suave)]"
                    />
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center gap-3">
                      <BarraProgreso
                        valor={porcentaje}
                        etiqueta={`Checklist de ${proyecto.nombre}`}
                      />
                      <span className="w-9 text-right text-xs font-medium tabular-nums">
                        {porcentaje}%
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-[var(--texto-suave)]">
                        {items.length === 0
                          ? 'Sin checklist'
                          : `${hechos} de ${items.length} pasos`}
                      </span>
                      {tareas > 0 && (
                        <Etiqueta tono="primario">
                          {tareas} {tareas === 1 ? 'tarea activa' : 'tareas activas'}
                        </Etiqueta>
                      )}
                      {proyecto.notasMarkdown.trim() !== '' && (
                        <Etiqueta>Con notas</Etiqueta>
                      )}
                    </div>
                  </div>
                </Tarjeta>
              </Link>
            )
          })}
        </div>
      )}

      <ModalProyecto abierto={modal} onCerrar={() => setModal(false)} />
    </>
  )
}
