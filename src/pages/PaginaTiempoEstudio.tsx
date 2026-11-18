import { useMemo, useState } from 'react'
import { Plus, Clock, BarChart2, List } from 'lucide-react'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Boton } from '../components/ui/Boton'
import { ListaSesionesEstudio } from '../components/studyTime/ListaSesionesEstudio'
import { GraficoTiempoEstudio } from '../components/studyTime/GraficoTiempoEstudio'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/format'

export function PaginaTiempoEstudio() {
  const { datos, crearSesionEstudio, actualizarSesionEstudio, eliminarSesionEstudio } = useAppStore()
  const [vista, setVista] = useState<'lista' | 'graficos'>('lista')
  const [solicitudNueva, setSolicitudNueva] = useState(0)

  const sesionesPorAsignatura = useMemo(() => {
    const mapa = new Map<string, typeof datos.sesionesEstudio>()
    for (const sesion of datos.sesionesEstudio) {
      const lista = mapa.get(sesion.asignaturaId)
      if (lista) lista.push(sesion)
      else mapa.set(sesion.asignaturaId, [sesion])
    }
    return mapa
  }, [datos.sesionesEstudio])

  const asignaturasConSesiones = useMemo(
    () => datos.asignaturas.filter((a) => sesionesPorAsignatura.has(a.id)),
    [datos.asignaturas, sesionesPorAsignatura],
  )

  const abrirNuevaSesion = () => {
    setVista('lista')
    setSolicitudNueva((n) => n + 1)
  }

  return (
    <div className="animar-entrada grid gap-6">
      <CabeceraPagina
        titulo="Tiempo de estudio"
        descripcion="Registra tus sesiones y analiza cuánto dedicas a cada asignatura"
        accion={
          <Boton onClick={abrirNuevaSesion}>
            <Plus size={18} className="mr-1" /> Nueva sesión
          </Boton>
        }
      />

      {/* Selector de vista */}
      <div className="flex gap-2" role="tablist" aria-label="Vista de tiempo de estudio">
        <button
          role="tab"
          aria-selected={vista === 'lista'}
          onClick={() => setVista('lista')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
            vista === 'lista'
              ? 'bg-[var(--primario)] text-[var(--primario-contraste)]'
              : 'bg-[var(--superficie)] text-[var(--texto)] hover:bg-[var(--superficie-2)] border border-[var(--borde)]',
          )}
        >
          <List size={18} /> Sesiones
        </button>
        <button
          role="tab"
          aria-selected={vista === 'graficos'}
          onClick={() => setVista('graficos')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
            vista === 'graficos'
              ? 'bg-[var(--primario)] text-[var(--primario-contraste)]'
              : 'bg-[var(--superficie)] text-[var(--texto)] hover:bg-[var(--superficie-2)] border border-[var(--borde)]',
          )}
        >
          <BarChart2 size={18} /> Gráficos
        </button>
      </div>

      {vista === 'lista' ? (
        <ListaSesionesEstudio
          sesiones={datos.sesionesEstudio}
          asignaturas={datos.asignaturas}
          onCrear={crearSesionEstudio}
          onActualizar={actualizarSesionEstudio}
          onEliminar={eliminarSesionEstudio}
          solicitudNueva={solicitudNueva}
          onSolicitudAtendida={() => setSolicitudNueva(0)}
        />
      ) : (
        <GraficoTiempoEstudio
          sesiones={datos.sesionesEstudio}
          asignaturas={datos.asignaturas}
        />
      )}

      {/* Resumen por asignatura (solo en vista lista) */}
      {vista === 'lista' && asignaturasConSesiones.length > 0 && (
        <section aria-label="Resumen por asignatura">
          <h2 className="mb-3 text-lg font-semibold">Resumen por asignatura</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {asignaturasConSesiones.map((asignatura) => {
              const sesionesAsig = sesionesPorAsignatura.get(asignatura.id) ?? []
              const totalMinutos = sesionesAsig.reduce((sum, s) => sum + s.duracionMinutos, 0)
              const numSesiones = sesionesAsig.length
              const promedio = numSesiones > 0 ? Math.round(totalMinutos / numSesiones) : 0

              // Última sesión
              const ultimaSesion = sesionesAsig
                .slice()
                .sort((a, b) => (b.fecha + b.inicio).localeCompare(a.fecha + a.inicio))[0]

              return (
                <Tarjeta key={asignatura.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: asignatura.color }}
                    >
                      <Clock size={20} className="text-white/90" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{asignatura.nombre}</h3>
                      <p className="text-sm text-[var(--texto-suave)]">
                        {numSesiones} sesión{numSesiones !== 1 ? 'es' : ''}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-[var(--texto-suave)]">Total</p>
                          <p className="font-medium text-[var(--primario)]">
                            {totalMinutos >= 60
                              ? `${Math.floor(totalMinutos / 60)}h ${totalMinutos % 60}min`
                              : `${totalMinutos}min`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--texto-suave)]">Promedio</p>
                          <p className="font-medium">
                            {promedio >= 60
                              ? `${Math.floor(promedio / 60)}h ${promedio % 60}min`
                              : `${promedio}min`}
                          </p>
                        </div>
                      </div>
                      {ultimaSesion && (
                        <p className="mt-2 text-xs text-[var(--texto-suave)]">
                          Última: {new Date(ultimaSesion.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })} · {ultimaSesion.inicio}-{ultimaSesion.fin}
                        </p>
                      )}
                    </div>
                  </div>
                </Tarjeta>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}