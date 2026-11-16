import { useEffect, useState } from 'react'
import { Plus, Target, BarChart2, Calendar, TrendingUp } from 'lucide-react'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Boton } from '../components/ui/Boton'
import { ListaHabitos } from '../components/habits/ListaHabitos'
import { GraficoProgresoHabitos } from '../components/habits/GraficoProgresoHabitos'
import { useAppStore } from '../store/useAppStore'
import { hoyISO, sumarDias } from '../domain/dates'
import { cn } from '../lib/format'

export function PaginaHabitos() {
  const { datos, crearHabito, actualizarHabito, eliminarHabito, archivarHabito, reordenarHabitos, alternarRegistroHabito } =
    useAppStore()
  const [habitosSeleccionados, setHabitosSeleccionados] = useState<string[]>(
    datos.habitos.filter((h) => !h.archivado).slice(0, 3).map((h) => h.id),
  )
  const [vista, setVista] = useState<'lista' | 'graficos'>('lista')
  const [solicitudNueva, setSolicitudNueva] = useState(0)

  const habitosActivos = datos.habitos.filter((h) => !h.archivado)

  // Mantiene la selección del gráfico sincronizada con los hábitos existentes.
  useEffect(() => {
    const idsActivos = datos.habitos.filter((h) => !h.archivado).map((h) => h.id)
    setHabitosSeleccionados((seleccionados) => {
      const vigentes = seleccionados.filter((id) => idsActivos.includes(id))
      if (vigentes.length === seleccionados.length) return seleccionados
      return vigentes.length > 0 ? vigentes : idsActivos.slice(0, 3)
    })
  }, [datos.habitos])

  const abrirNuevoHabito = () => {
    setVista('lista')
    setSolicitudNueva((n) => n + 1)
  }

  return (
    <div className="animar-entrada grid gap-6">
      <CabeceraPagina
        titulo="Hábitos"
        descripcion="Construye rutinas, mantén rachas y visualiza tu progreso"
        accion={
          <Boton onClick={abrirNuevoHabito}>
            <Plus size={18} className="mr-1" /> Nuevo hábito
          </Boton>
        }
      />

      {/* Selector de vista */}
      <div className="flex gap-2" role="tablist" aria-label="Vista de hábitos">
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
          <Target size={18} /> Lista
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
        <ListaHabitos
          habitos={datos.habitos}
          registros={datos.registrosHabitos}
          onCrear={crearHabito}
          onActualizar={actualizarHabito}
          onEliminar={eliminarHabito}
          onArchivar={archivarHabito}
          onReordenar={reordenarHabitos}
          onAlternarRegistro={alternarRegistroHabito}
          solicitudNueva={solicitudNueva}
          onSolicitudAtendida={() => setSolicitudNueva(0)}
        />
      ) : (
        <>
          <GraficoProgresoHabitos
            habitos={datos.habitos}
            registros={datos.registrosHabitos}
            habitosSeleccionados={habitosSeleccionados}
            onCambiarSeleccion={setHabitosSeleccionados}
          />

          {/* Resumen rápido */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {habitosActivos.slice(0, 4).map((habito) => {
              const registrosHabito = datos.registrosHabitos.filter((r) => r.habitoId === habito.id)
              const completados = registrosHabito.filter((r) => r.completado).length
              const total = registrosHabito.length
              const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0

              // Racha actual
              let racha = 0
              const ordenados = registrosHabito
                .filter((r) => r.completado)
                .map((r) => r.fecha)
                .sort()
                .reverse()
              let fechaEsperada = hoyISO()
              for (const fecha of ordenados) {
                if (fecha === fechaEsperada) {
                  racha++
                  fechaEsperada = sumarDias(fechaEsperada, -1)
                } else if (fecha < fechaEsperada) {
                  break
                }
              }

              return (
                <Tarjeta key={habito.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: habito.color }}
                    >
                      {habito.objetivo && (
                        <span className="text-xs font-bold text-white">
                          {habito.objetivo}{habito.unidad ? ` ${habito.unidad[0]}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{habito.nombre}</h4>
                      <p className="text-sm text-[var(--texto-suave)]">
                        {habito.frecuencia === 'diaria' && 'Diario'}
                        {habito.frecuencia === 'semanal' && `Semanal (${habito.diasSemana?.length ?? 0} días)`}
                        {habito.frecuencia === 'mensual' && 'Mensual'}
                        {habito.frecuencia === 'personalizada' && `Personalizada (${habito.diasSemana?.length ?? 0} días)`}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-[var(--exito)]">
                          <TrendingUp size={14} /> {racha} días
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {completados}/{total} ({porcentaje}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </Tarjeta>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
