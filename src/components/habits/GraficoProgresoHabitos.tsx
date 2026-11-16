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

function generarDatosSemana(habitos: Habito[], registros: RegistroHabito[], habitosSeleccionados: string[]) {
  const hoy = new Date()
  const inicio = startOfWeek(hoy, { weekStartsOn: 1 })
  const fin = endOfWeek(hoy, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin })

  return dias.map((dia) => {
    const fechaStr = format(dia, 'yyyy-MM-dd')
    const diaNombre = format(dia, 'EEE', { locale: es })
    const item: Record<string, string | number> = { fecha: fechaStr, dia: diaNombre }

    habitosSeleccionados.forEach((habitoId, i) => {
      const habito = habitos.find((h) => h.id === habitoId)
      if (!habito) return

      let seEspera = false
      const diaSemana = dia.getDay()
      switch (habito.frecuencia) {
        case 'diaria':
          seEspera = true
          break
        case 'semanal':
          seEspera = habito.diasSemana?.includes(diaSemana) ?? false
          break
        case 'mensual':
          seEspera = habito.diaMes === dia.getDate()
          break
        case 'personalizada':
          seEspera = habito.diasSemana?.includes(diaSemana) ?? false
          break
      }

      const registro = registros.find((r) => r.habitoId === habitoId && r.fecha === fechaStr)
      const completado = registro?.completado ?? false

      item[`h${i}`] = seEspera ? (completado ? 1 : 0) : 0
    })

    return item
  })
}

function generarDatosMes(habitos: Habito[], registros: RegistroHabito[], habitosSeleccionados: string[]) {
  const hoy = new Date()
  const inicio = startOfMonth(hoy)
  const fin = endOfMonth(hoy)
  const semanas = eachWeekOfInterval({ start: inicio, end: fin }, { weekStartsOn: 1 })

  return semanas.map((semana) => {
    const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 })
    const finSemana = endOfWeek(semana, { weekStartsOn: 1 })
    const semanaLabel = `${format(inicioSemana, 'dd/MM', { locale: es })}`

    const item: Record<string, string | number> = { semana: semanaLabel }

    habitosSeleccionados.forEach((habitoId, i) => {
      const habito = habitos.find((h) => h.id === habitoId)
      if (!habito) return

      let completados = 0
      let esperados = 0

      const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana })
      for (const dia of diasSemana) {
        const fechaStr = format(dia, 'yyyy-MM-dd')
        const diaSemanaNum = dia.getDay()

        let seEspera = false
        switch (habito.frecuencia) {
          case 'diaria':
            seEspera = true
            break
          case 'semanal':
            seEspera = habito.diasSemana?.includes(diaSemanaNum) ?? false
            break
          case 'mensual':
            seEspera = habito.diaMes === dia.getDate()
            break
          case 'personalizada':
            seEspera = habito.diasSemana?.includes(diaSemanaNum) ?? false
            break
        }

        if (seEspera) {
          esperados++
          const registro = registros.find((r) => r.habitoId === habitoId && r.fecha === fechaStr)
          if (registro?.completado) completados++
        }
      }

      item[`h${i}`] = esperados > 0 ? Math.round((completados / esperados) * 100) : 0
    })

    return item
  })
}

function generarDatosAño(habitos: Habito[], registros: RegistroHabito[], habitosSeleccionados: string[]) {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), 0, 1)
  const fin = new Date(hoy.getFullYear(), 11, 31)
  const meses = eachMonthOfInterval({ start: inicio, end: fin })

  return meses.map((mes) => {
    const inicioMes = startOfMonth(mes)
    const finMes = endOfMonth(mes)
    const mesLabel = format(mes, 'MMM', { locale: es })

    const item: Record<string, string | number> = { mes: mesLabel }

    habitosSeleccionados.forEach((habitoId, i) => {
      const habito = habitos.find((h) => h.id === habitoId)
      if (!habito) return

      let completados = 0
      let esperados = 0

      const diasMes = eachDayOfInterval({ start: inicioMes, end: finMes })
      for (const dia of diasMes) {
        const fechaStr = format(dia, 'yyyy-MM-dd')
        const diaSemanaNum = dia.getDay()

        let seEspera = false
        switch (habito.frecuencia) {
          case 'diaria':
            seEspera = true
            break
          case 'semanal':
            seEspera = habito.diasSemana?.includes(diaSemanaNum) ?? false
            break
          case 'mensual':
            seEspera = habito.diaMes === dia.getDate()
            break
          case 'personalizada':
            seEspera = habito.diasSemana?.includes(diaSemanaNum) ?? false
            break
        }

        if (seEspera) {
          esperados++
          const registro = registros.find((r) => r.habitoId === habitoId && r.fecha === fechaStr)
          if (registro?.completado) completados++
        }
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

  const habitosDisponibles = habitos.filter((h) => !h.archivado)
  const datos = useMemo(() => {
    switch (vista) {
      case 'semana':
        return generarDatosSemana(habitos, registros, habitosSeleccionados)
      case 'mes':
        return generarDatosMes(habitos, registros, habitosSeleccionados)
      case 'año':
        return generarDatosAño(habitos, registros, habitosSeleccionados)
    }
  }, [vista, habitos, registros, habitosSeleccionados])

  const clavesHabitos = useMemo(() => {
    return habitosSeleccionados.map((id, i) => ({ id, clave: `h${i}`, habito: habitos.find((h) => h.id === id) }))
  }, [habitosSeleccionados, habitos])

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
      <div className="mb-4 flex items-center justify-between">
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

      <div className="h-64" role="img" aria-label={`Gráfico de progreso de hábitos - vista ${vista}`}>
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