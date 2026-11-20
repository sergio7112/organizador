import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Tarjeta } from '../ui/Tarjeta'
import { ControlSegmentado } from '../ui/ControlSegmentado'
import { cn } from '../../lib/format'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { PALETA } from '../../domain/types'
import type { Habito, RegistroHabito } from '../../domain/types'

type VistaGrafico = 'semana' | 'mes' | 'año'

interface GraficoProgresoHabitosProps {
  habitos: Habito[]
  registros: RegistroHabito[]
  habitosSeleccionados: string[]
  onCambiarSeleccion: (ids: string[]) => void
}

const COLORES_GRAFICO = PALETA.map((color) => color.valor)

type IndiceRegistros = Map<string, Map<string, boolean>>

/** Índice habitoId → fecha → completado, para no recorrer la lista por cada día. */
function indexarRegistros(registros: RegistroHabito[]): IndiceRegistros {
  const indice: IndiceRegistros = new Map()

  for (const registro of registros) {
    let fechas = indice.get(registro.habitoId)
    if (!fechas) {
      fechas = new Map()
      indice.set(registro.habitoId, fechas)
    }
    fechas.set(registro.fecha, registro.completado)
  }

  return indice
}

function seEspera(habito: Habito, dia: Date): boolean {
  switch (habito.frecuencia) {
    case 'diaria':
      return true
    case 'semanal':
    case 'personalizada':
      return habito.diasSemana?.includes(dia.getDay()) ?? false
    case 'mensual':
      return habito.diaMes === dia.getDate()
  }
}

function habitosSeleccionadosDe(
  habitosPorId: Map<string, Habito>,
  ids: string[],
): Habito[] {
  const seleccionados: Habito[] = []
  for (const id of ids) {
    const habito = habitosPorId.get(id)
    if (habito) seleccionados.push(habito)
  }
  return seleccionados
}

function generarDatosSemana(
  habitosPorId: Map<string, Habito>,
  indice: IndiceRegistros,
  habitosSeleccionados: string[],
) {
  const hoy = new Date()
  const inicio = startOfWeek(hoy, { weekStartsOn: 1 })
  const fin = endOfWeek(hoy, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin })
  const habitos = habitosSeleccionadosDe(habitosPorId, habitosSeleccionados)

  return dias.map((dia) => {
    const fecha = format(dia, 'yyyy-MM-dd')
    const item: Record<string, string | number> = {
      fecha,
      dia: format(dia, 'EEE', { locale: es }),
    }

    habitos.forEach((habito, i) => {
      const completado = indice.get(habito.id)?.get(fecha) ?? false
      item[`h${i}`] = seEspera(habito, dia) && completado ? 1 : 0
    })

    return item
  })
}

function generarDatosMes(
  habitosPorId: Map<string, Habito>,
  indice: IndiceRegistros,
  habitosSeleccionados: string[],
) {
  const hoy = new Date()
  const inicio = startOfMonth(hoy)
  const fin = endOfMonth(hoy)
  const semanas = eachWeekOfInterval({ start: inicio, end: fin }, { weekStartsOn: 1 })
  const habitos = habitosSeleccionadosDe(habitosPorId, habitosSeleccionados)

  return semanas.map((semana) => {
    const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 })
    const finSemana = endOfWeek(semana, { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: inicioSemana, end: finSemana }).map(
      (dia) => ({ dia, fecha: format(dia, 'yyyy-MM-dd') }),
    )
    const item: Record<string, string | number> = {
      semana: format(inicioSemana, 'dd/MM', { locale: es }),
    }

    habitos.forEach((habito, i) => {
      const fechas = indice.get(habito.id)
      let completados = 0
      let esperados = 0

      for (const { dia: fechaDia, fecha } of dias) {
        if (!seEspera(habito, fechaDia)) continue
        esperados += 1
        if (fechas?.get(fecha)) completados += 1
      }

      item[`h${i}`] = esperados > 0 ? Math.round((completados / esperados) * 100) : 0
    })

    return item
  })
}

function generarDatosAño(
  habitosPorId: Map<string, Habito>,
  indice: IndiceRegistros,
  habitosSeleccionados: string[],
) {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), 0, 1)
  const fin = new Date(hoy.getFullYear(), 11, 31)
  const meses = eachMonthOfInterval({ start: inicio, end: fin })
  const habitos = habitosSeleccionadosDe(habitosPorId, habitosSeleccionados)

  return meses.map((mes) => {
    const inicioMes = startOfMonth(mes)
    const finMes = endOfMonth(mes)
    const dias = eachDayOfInterval({ start: inicioMes, end: finMes }).map(
      (dia) => ({ dia, fecha: format(dia, 'yyyy-MM-dd') }),
    )
    const item: Record<string, string | number> = {
      mes: format(mes, 'MMM', { locale: es }),
    }

    habitos.forEach((habito, i) => {
      const fechas = indice.get(habito.id)
      let completados = 0
      let esperados = 0

      for (const { dia: fechaDia, fecha } of dias) {
        if (!seEspera(habito, fechaDia)) continue
        esperados += 1
        if (fechas?.get(fecha)) completados += 1
      }

      item[`h${i}`] = esperados > 0 ? Math.round((completados / esperados) * 100) : 0
    })

    return item
  })
}

export function GraficoProgresoHabitos({
  habitos,
  registros,
  habitosSeleccionados,
  onCambiarSeleccion,
}: GraficoProgresoHabitosProps) {
  const [vista, setVista] = useState<VistaGrafico>('semana')

  const habitosDisponibles = useMemo(
    () => habitos.filter((h) => !h.archivado),
    [habitos],
  )

  const habitosPorId = useMemo(
    () => new Map(habitos.map((habito) => [habito.id, habito])),
    [habitos],
  )

  const indiceRegistros = useMemo(() => indexarRegistros(registros), [registros])

  const datos = useMemo(() => {
    switch (vista) {
      case 'semana':
        return generarDatosSemana(
          habitosPorId,
          indiceRegistros,
          habitosSeleccionados,
        )
      case 'mes':
        return generarDatosMes(habitosPorId, indiceRegistros, habitosSeleccionados)
      case 'año':
        return generarDatosAño(habitosPorId, indiceRegistros, habitosSeleccionados)
    }
  }, [vista, habitosPorId, indiceRegistros, habitosSeleccionados])

  const clavesHabitos = useMemo(() => {
    return habitosSeleccionados.map((id, i) => ({
      id,
      clave: `h${i}`,
      habito: habitosPorId.get(id),
    }))
  }, [habitosSeleccionados, habitosPorId])

  if (habitosDisponibles.length === 0) {
    return (
      <Tarjeta className="py-12 text-center">
        <p className="text-[var(--texto-suave)]">Crea hábitos para ver tu progreso aquí.</p>
      </Tarjeta>
    )
  }

  if (habitosSeleccionados.length === 0) {
    return (
      <Tarjeta className="py-12 text-center">
        <p className="text-[var(--texto-suave)]">Selecciona al menos un hábito para ver su progreso.</p>
      </Tarjeta>
    )
  }

  return (
    <Tarjeta>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Progreso de hábitos</h3>
        <ControlSegmentado
          valor={vista}
          onChange={setVista}
          opciones={[
            { valor: 'semana', etiqueta: 'Semana' },
            { valor: 'mes', etiqueta: 'Mes' },
            { valor: 'año', etiqueta: 'Año' },
          ]}
          ariaLabel="Periodo del gráfico"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Seleccionar hábitos">
        {habitosDisponibles.map((habito, index) => (
          <button
            key={habito.id}
            type="button"
            onClick={() =>
              onCambiarSeleccion(
                habitosSeleccionados.includes(habito.id)
                  ? habitosSeleccionados.filter((id) => id !== habito.id)
                  : [...habitosSeleccionados, habito.id],
              )
            }
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
              habitosSeleccionados.includes(habito.id)
                ? 'bg-[var(--primario)] text-[var(--primario-contraste)]'
                : 'bg-[var(--superficie-2)] text-[var(--texto)] hover:bg-[var(--borde)]',
            )}
            style={{ borderLeft: `3px solid ${COLORES_GRAFICO[index % COLORES_GRAFICO.length]}` }}
            aria-pressed={habitosSeleccionados.includes(habito.id)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: habito.color }}
            />
            {habito.nombre}
          </button>
        ))}
      </div>

      <div className="h-72 sm:h-80" role="img" aria-label={`Gráfico de progreso de hábitos - vista ${vista}`}>
        <ResponsiveContainer width="100%" height="100%">
          {vista === 'semana' ? (
            <AreaChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {clavesHabitos.map(({ clave, habito }, i) => (
                  <linearGradient key={clave} id={`color-${clave}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={habito?.color ?? COLORES_GRAFICO[i % COLORES_GRAFICO.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={habito?.color ?? COLORES_GRAFICO[i % COLORES_GRAFICO.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" vertical={false} />
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                tickCount={5}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--superficie)',
                  border: '1px solid var(--borde)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'var(--texto)', fontWeight: 600 }}
                formatter={(value: unknown, name: string | number | undefined) => {
                  const numValue = typeof value === 'number' ? value : 0
                  const nameStr = String(name ?? '')
                  const habito = clavesHabitos.find((h) => nameStr === h.clave)?.habito
                  return [
                    numValue === 1 ? 'Completado' : numValue === 0 ? 'Pendiente' : numValue,
                    habito?.nombre ?? nameStr,
                  ]
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(name) => {
                  const habitoInfo = clavesHabitos.find((h) => name === h.clave)
                  return habitoInfo?.habito?.nombre ?? name
                }}
              />
              {clavesHabitos.map(({ clave, habito }, i) => (
                <Area
                  key={clave}
                  type="monotone"
                  dataKey={clave}
                  stroke={habito?.color ?? COLORES_GRAFICO[i % COLORES_GRAFICO.length]}
                  fillOpacity={1}
                  fill={`url(#color-${clave})`}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                domain={[0, 'dataMax + 10']}
              />
              <YAxis
                dataKey={vista === 'mes' ? 'semana' : 'mes'}
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--texto)', fontSize: 11 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--superficie)',
                  border: '1px solid var(--borde)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: 'var(--texto)', fontWeight: 600 }}
                formatter={(value: unknown, name: string | number | undefined) => {
                  const numValue = typeof value === 'number' ? value : 0
                  const nameStr = String(name ?? '')
                  const habito = clavesHabitos.find((h) => nameStr === h.clave)?.habito
                  return [`${numValue}%`, habito?.nombre ?? nameStr]
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(name) => {
                  const habitoInfo = clavesHabitos.find((h) => name === h.clave)
                  return habitoInfo?.habito?.nombre ?? name
                }}
              />
              {clavesHabitos.map(({ clave, habito }, i) => (
                <Bar
                  key={clave}
                  dataKey={clave}
                  fill={habito?.color ?? COLORES_GRAFICO[i % COLORES_GRAFICO.length]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Leyenda de objetivos */}
      {clavesHabitos.some(({ habito }) => habito?.objetivo) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--texto-suave)]">
          {clavesHabitos
            .filter(({ habito }) => habito?.objetivo)
            .map(({ habito }) => (
              <span key={habito!.id} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: habito!.color }}
                />
                {habito!.nombre}: objetivo {habito!.objetivo} {habito!.unidad ?? ''}
              </span>
            ))}
        </div>
      )}
    </Tarjeta>
  )
}