import { useState } from 'react'
import type { ReactNode } from 'react'
import { ListChecks } from 'lucide-react'
import type { Tarea } from '../../domain/types'
import { agruparTareas } from '../../domain/tasks'
import { hoyISO } from '../../domain/dates'
import { useAppStore } from '../../store/useAppStore'
import { EstadoVacio } from '../ui/EstadoVacio'
import { Tarjeta } from '../ui/Tarjeta'
import { DialogoConfirmacion } from '../ui/DialogoConfirmacion'
import { FilaTarea } from './FilaTarea'
import { ModalTarea } from './ModalTarea'

export function ListaTareas({
  tareas,
  agrupada = false,
  accionVacio,
}: {
  tareas: Tarea[]
  agrupada?: boolean
  accionVacio?: ReactNode
}) {
  const datos = useAppStore((estado) => estado.datos)
  const actualizarTarea = useAppStore((estado) => estado.actualizarTarea)
  const eliminarTarea = useAppStore((estado) => estado.eliminarTarea)

  const [editando, setEditando] = useState<Tarea | null>(null)
  const [eliminando, setEliminando] = useState<Tarea | null>(null)

  if (tareas.length === 0) {
    return (
      <EstadoVacio
        icono={ListChecks}
        titulo="No hay tareas que mostrar"
        descripcion="Cuando añadas tareas aparecerán aquí ordenadas por urgencia."
        accion={accionVacio}
      />
    )
  }

  const grupos = agrupada
    ? agruparTareas(tareas, hoyISO())
    : [{ clave: 'todas', etiqueta: '', tareas }]

  return (
    <>
      {grupos.map((grupo) => (
        <section key={grupo.clave} className="mb-5 last:mb-0">
          {agrupada && (
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{grupo.etiqueta}</h2>
              <span className="text-xs tabular-nums text-[var(--texto-suave)]">
                {grupo.tareas.length}
              </span>
            </div>
          )}
          <Tarjeta className="overflow-hidden">
            <ul className="divide-y divide-[var(--borde)]">
              {grupo.tareas.map((tarea) => {
                const vinculo = tarea.vinculo
                const asignatura =
                  vinculo?.tipo === 'asignatura'
                    ? datos.asignaturas.find((item) => item.id === vinculo.id)
                    : undefined
                const proyecto =
                  vinculo?.tipo === 'proyecto'
                    ? datos.proyectos.find((item) => item.id === vinculo.id)
                    : undefined

                return (
                  <FilaTarea
                    key={tarea.id}
                    tarea={tarea}
                    asignatura={asignatura}
                    proyecto={proyecto}
                    onAlternar={() =>
                      actualizarTarea(tarea.id, {
                        estado: tarea.estado === 'hecha' ? 'pendiente' : 'hecha',
                      })
                    }
                    onEditar={() => setEditando(tarea)}
                    onEliminar={() => setEliminando(tarea)}
                  />
                )
              })}
            </ul>
          </Tarjeta>
        </section>
      ))}

      <ModalTarea
        abierto={editando !== null}
        tarea={editando}
        onCerrar={() => setEditando(null)}
      />

      <DialogoConfirmacion
        abierto={eliminando !== null}
        titulo="Eliminar tarea"
        mensaje={
          eliminando
            ? `Se eliminará «${eliminando.titulo}». Esta acción no se puede deshacer.`
            : ''
        }
        onCerrar={() => setEliminando(null)}
        onConfirmar={() => {
          if (eliminando) eliminarTarea(eliminando.id)
        }}
      />
    </>
  )
}
