import { useMemo, useState } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import type { Examen } from '../domain/types'
import { progresoExamen } from '../domain/exams'
import { hoyISO } from '../domain/dates'
import { useAppStore } from '../store/useAppStore'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion'
import { TarjetaExamen } from '../components/exams/TarjetaExamen'
import { ModalExamen } from '../components/exams/ModalExamen'

export function PaginaExamenes() {
  const datos = useAppStore((estado) => estado.datos)
  const eliminarExamen = useAppStore((estado) => estado.eliminarExamen)

  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Examen | null>(null)
  const [eliminando, setEliminando] = useState<Examen | null>(null)

  const hoy = hoyISO()

  const { futuros, pasados } = useMemo(() => {
    const ordenados = datos.examenes
      .slice()
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
    return {
      futuros: ordenados.filter((examen) => examen.fecha >= hoy),
      pasados: ordenados.filter((examen) => examen.fecha < hoy).reverse(),
    }
  }, [datos.examenes, hoy])

  const proximo = futuros[0]
  const proximoProgreso = proximo ? progresoExamen(proximo, datos.temas) : null

  return (
    <>
      <CabeceraPagina
        titulo="Exámenes"
        descripcion={
          proximo && proximoProgreso
            ? `Siguiente: ${proximo.titulo} · ${proximoProgreso.porcentajeDominado} % dominado`
            : `${datos.examenes.length} ${datos.examenes.length === 1 ? 'examen' : 'exámenes'} registrados`
        }
        accion={
          <Boton onClick={() => setModal(true)}>
            <Plus size={17} />
            Nuevo examen
          </Boton>
        }
      />

      {datos.examenes.length === 0 ? (
        <EstadoVacio
          icono={GraduationCap}
          titulo="Todavía no hay exámenes"
          descripcion="Añade tus exámenes con la fecha y los temas que entran para no perderlos de vista."
          accion={
            <Boton onClick={() => setModal(true)}>
              <Plus size={16} />
              Crear examen
            </Boton>
          }
        />
      ) : (
        <>
          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-base font-semibold">Próximos</h2>
              <span className="text-xs tabular-nums text-[var(--texto-suave)]">
                {futuros.length}
              </span>
            </div>

            {futuros.length === 0 ? (
              <EstadoVacio
                icono={GraduationCap}
                titulo="No hay exámenes próximos"
                descripcion="Cuando añadas un examen con fecha futura aparecerá aquí."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {futuros.map((examen) => (
                  <TarjetaExamen
                    key={examen.id}
                    examen={examen}
                    asignatura={datos.asignaturas.find(
                      (asignatura) => asignatura.id === examen.asignaturaId,
                    )}
                    progreso={progresoExamen(examen, datos.temas)}
                    onEditar={() => setEditando(examen)}
                    onEliminar={() => setEliminando(examen)}
                  />
                ))}
              </div>
            )}
          </section>

          {pasados.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-base font-semibold">Pasados</h2>
                <span className="text-xs tabular-nums text-[var(--texto-suave)]">
                  {pasados.length}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pasados.map((examen) => (
                  <TarjetaExamen
                    key={examen.id}
                    examen={examen}
                    asignatura={datos.asignaturas.find(
                      (asignatura) => asignatura.id === examen.asignaturaId,
                    )}
                    progreso={progresoExamen(examen, datos.temas)}
                    onEditar={() => setEditando(examen)}
                    onEliminar={() => setEliminando(examen)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ModalExamen abierto={modal} onCerrar={() => setModal(false)} />

      <ModalExamen
        abierto={editando !== null}
        examen={editando}
        onCerrar={() => setEditando(null)}
      />

      <DialogoConfirmacion
        abierto={eliminando !== null}
        titulo="Eliminar examen"
        mensaje={
          eliminando
            ? `Se eliminará «${eliminando.titulo}». Los temas y las tareas no se modifican.`
            : ''
        }
        onCerrar={() => setEliminando(null)}
        onConfirmar={() => {
          if (eliminando) eliminarExamen(eliminando.id)
        }}
      />
    </>
  )
}
