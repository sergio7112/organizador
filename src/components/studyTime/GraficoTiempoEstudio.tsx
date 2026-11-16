import { useMemo, useState } from 'react'
import {
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell as PieCell,
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
import type { SesionEstudio, Asignatura } from '../../domain/types'

type VistaGrafico = 'semana' | 'mes' | 'año' | 'asignaturas'
type TipoGrafico = 'barras' | 'linea' | 'area'

const COLORES_GRAFICO = PALETA.map((color) => color.valor)

function formatearDuracion(minutos: number): string {
  if (minutos >= 60) {
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return `${minutos}min`
}

function generarDatosSemana(sesiones: SesionEstudio[], asignaturas: Asignatura[]) {
  const hoy = new Date()
  const inicio = startOfWeek(hoy, { weekStartsOn: 1 })
  const fin = endOfWeek(hoy, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin })

  const asignaturasConDatos = asignaturas.filter((a) =>
    sesiones.some((s) => s.asignaturaId === a.id),
  )

  return dias.map((dia) => {
    const fechaStr = format(dia, 'yyyy-MM-dd')
    const diaNombre = format(dia, 'EEE', { locale: es })
    const item: Record<string, string | number> = { fecha: fechaStr, dia: diaNombre, total: 0 }

    for (const asignatura of asignaturasConDatos) {
      const sesionesDia = sesiones.filter(
        (s) => s.asignaturaId === asignatura.id && s.fecha === fechaStr,
      )
      const minutos = sesionesDia.reduce((sum, s) => sum + s.duracionMinutos, 0)
      item[`asig_${asignatura.id}`] = minutos
      item.total = (item.total as number) + minutos
    }

    return item
  })
}

function generarDatosMes(sesiones: SesionEstudio[], asignaturas: Asignatura[]) {
  const hoy = new Date()
  const inicio = startOfMonth(hoy)
  const fin = endOfMonth(hoy)
  const semanas = eachWeekOfInterval({ start: inicio, end: fin }, { weekStartsOn: 1 })

  const asignaturasConDatos = asignaturas.filter((a) =>
    sesiones.some((s) => s.asignaturaId === a.id),
  )

  return semanas.map((semana) => {
    const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 })
    const finSemana = endOfWeek(semana, { weekStartsOn: 1 })
    const semanaLabel = `${format(inicioSemana, 'dd/MM', { locale: es })}`
    const item: Record<string, string | number> = { semana: semanaLabel, total: 0 }

    for (const asignatura of asignaturasConDatos) {
      let minutos = 0
      const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana })
      for (const dia of diasSemana) {
        const fechaStr = format(dia, 'yyyy-MM-dd')
        const sesionesDia = sesiones.filter(
          (s) => s.asignaturaId === asignatura.id && s.fecha === fechaStr,
        )
        minutos += sesionesDia.reduce((sum, s) => sum + s.duracionMinutos, 0)
      }
      item[`asig_${asignatura.id}`] = minutos
      item.total = (item.total as number) + minutos
    }

    return item
  })
}

function generarDatosAño(sesiones: SesionEstudio[], asignaturas: Asignatura[]) {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), 0, 1)
  const fin = new Date(hoy.getFullYear(), 11, 31)
  const meses = eachMonthOfInterval({ start: inicio, end: fin })

  const asignaturasConDatos = asignaturas.filter((a) =>
    sesiones.some((s) => s.asignaturaId === a.id),
  )

  return meses.map((mes) => {
    const inicioMes = startOfMonth(mes)
    const finMes = endOfMonth(mes)
    const mesLabel = format(mes, 'MMM', { locale: es })
    const item: Record<string, string | number> = { mes: mesLabel, total: 0 }

    for (const asignatura of asignaturasConDatos) {
      let minutos = 0
      const diasMes = eachDayOfInterval({ start: inicioMes, end: finMes })
      for (const dia of diasMes) {
        const fechaStr = format(dia, 'yyyy-MM-dd')
        const sesionesDia = sesiones.filter(
          (s) => s.asignaturaId === asignatura.id && s.fecha === fechaStr,
        )
        minutos += sesionesDia.reduce((sum, s) => sum + s.duracionMinutos, 0)
      }
      item[`asig_${asignatura.id}`] = minutos
      item.total = (item.total as number) + minutos
    }

    return item
  })
}

function generarDatosPorAsignatura(sesiones: SesionEstudio[], asignaturas: Asignatura[]) {
  const asignaturasConDatos = asignaturas.filter((a) =>
    sesiones.some((s) => s.asignaturaId === a.id),
  )

  return asignaturasConDatos.map((asignatura) => {
    const sesionesAsig = sesiones.filter((s) => s.asignaturaId === asignatura.id)
    const totalMinutos = sesionesAsig.reduce((sum, s) => sum + s.duracionMinutos, 0)
    const numSesiones = sesionesAsig.length
    const promedio = numSesiones > 0 ? Math.round(totalMinutos / numSesiones) : 0

    return {
      nombre: asignatura.nombre,
      valor: totalMinutos,
      color: asignatura.color,
      numSesiones,
      promedio,
      porcentaje: 0,
    }
  })
}

interface GraficoTiempoEstudioProps {
  sesiones: SesionEstudio[]
  asignaturas: Asignatura[]
}

export function GraficoTiempoEstudio({ sesiones, asignaturas }: GraficoTiempoEstudioProps) {
  const [vista, setVista] = useState<VistaGrafico>('semana')
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('barras')
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<string[]>(
    asignaturas.filter((a) => sesiones.some((s) => s.asignaturaId === a.id)).slice(0, 5).map((a) => a.id),
  )

  const asignaturasConDatos = useMemo(
    () => asignaturas.filter((a) => sesiones.some((s) => s.asignaturaId === a.id)),
    [asignaturas, sesiones],
  )

  const datosGrafico = useMemo(() => {
    switch (vista) {
      case 'semana':
        return generarDatosSemana(sesiones, asignaturas)
      case 'mes':
        return generarDatosMes(sesiones, asignaturas)
      case 'año':
        return generarDatosAño(sesiones, asignaturas)
      case 'asignaturas':
        return generarDatosPorAsignatura(sesiones, asignaturas)
    }
  }, [vista, sesiones, asignaturas])

  const totalGeneral = useMemo(
    () => sesiones.reduce((sum, s) => sum + s.duracionMinutos, 0),
    [sesiones],
  )

  const datosPorAsignatura = useMemo(() => {
    const arr = generarDatosPorAsignatura(sesiones, asignaturas)
    const total = arr.reduce((sum, a) => sum + a.valor, 0)
    return arr.map((a) => ({ ...a, porcentaje: total > 0 ? Math.round((a.valor / total) * 100) : 0 }))
  }, [sesiones, asignaturas])

  if (sesiones.length === 0) {
    return (
      <Tarjeta className="py-12 text-center">
        <p className="text-[var(--texto-suave)]">No hay sesiones de estudio para mostrar gráficos.</p>
      </Tarjeta>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Resumen total */}
      <Tarjeta className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--texto-suave)]">Tiempo total de estudio</p>
            <p className="text-3xl font-bold text-[var(--primario)]">{formatearDuracion(totalGeneral)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--texto-suave)]">Sesiones registradas</p>
            <p className="text-2xl font-bold">{sesiones.length}</p>
          </div>
        </div>
      </Tarjeta>

      {/* Controles */}
      <Tarjeta className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Visualización</h3>
          {vista !== 'asignaturas' && (
            <ControlSegmentado
              valor={tipoGrafico}
              onChange={setTipoGrafico}
              opciones={[
                { valor: 'barras', etiqueta: 'Barras' },
                { valor: 'linea', etiqueta: 'Línea' },
                { valor: 'area', etiqueta: 'Área' },
              ]}
              ariaLabel="Tipo de gráfico"
            />
          )}
        </div>

        <ControlSegmentado
          valor={vista}
          onChange={setVista}
          opciones={[
            { valor: 'semana', etiqueta: 'Semana' },
            { valor: 'mes', etiqueta: 'Mes' },
            { valor: 'año', etiqueta: 'Año' },
            { valor: 'asignaturas', etiqueta: 'Por asignatura' },
          ]}
          ariaLabel="Periodo del gráfico"
        />

        {vista !== 'asignaturas' && asignaturasConDatos.length > 1 && (
          <div className="mt-4" role="group" aria-label="Seleccionar asignaturas">
            <label className="block text-sm font-medium text-[var(--texto-suave)] mb-2">
              Filtrar asignaturas ({asignaturasSeleccionadas.length}/{asignaturasConDatos.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {asignaturasConDatos.map((asignatura) => (
                <button
                  key={asignatura.id}
                  type="button"
                  onClick={() =>
                    setAsignaturasSeleccionadas((prev) =>
                      prev.includes(asignatura.id)
                        ? prev.filter((id) => id !== asignatura.id)
                        : [...prev, asignatura.id],
                    )
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                    asignaturasSeleccionadas.includes(asignatura.id)
                      ? 'bg-[var(--primario)] text-[var(--primario-contraste)]'
                      : 'bg-[var(--superficie-2)] text-[var(--texto)] hover:bg-[var(--borde)]',
                  )}
                  style={{ borderLeft: `3px solid ${asignatura.color}` }}
                  aria-pressed={asignaturasSeleccionadas.includes(asignatura.id)}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: asignatura.color }}
                  />
                  {asignatura.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </Tarjeta>

      {/* Gráfico principal */}
      <Tarjeta>
        <div className="h-80" role="img" aria-label={`Gráfico de tiempo de estudio - ${vista}`}>
          <ResponsiveContainer width="100%" height="100%">
            {vista === 'asignaturas' ? (
              <PieChart>
                <Pie
                  data={datosPorAsignatura}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="valor"
                  nameKey="nombre"
                  label={({ name, percent, payload }: { name?: string; percent?: number; payload?: { porcentaje?: number } }) => {
                    const porcentaje = payload?.porcentaje ?? Math.round((percent ?? 0) * 100)
                    return `${name ?? ''} ${porcentaje}%`
                  }}
                  labelLine={false}
                >
                  {datosPorAsignatura.map((_, i) => (
                    <PieCell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--superficie)',
                    border: '1px solid var(--borde)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: unknown) => [formatearDuracion(typeof value === 'number' ? value : 0), 'Tiempo']}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(name) => {
                    const item = datosPorAsignatura.find((d) => d.nombre === name)
                    return item ? `${name} (${formatearDuracion(item.valor)})` : name
                  }}
                />
              </PieChart>
            ) : (
              <>
                {tipoGrafico === 'linea' ? (
                  <LineChart data={datosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" vertical={false} />
                    <XAxis
                      dataKey={vista === 'semana' ? 'dia' : vista === 'mes' ? 'semana' : 'mes'}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                      tickFormatter={(value) => formatearDuracion(value)}
                      domain={[0, 'dataMax + 10']}
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
                        if (nameStr === 'total') return [formatearDuracion(numValue), 'Total']
                        const asig = asignaturasConDatos.find((a) => `asig_${a.id}` === nameStr)
                        return asig ? [formatearDuracion(numValue), asig.nombre] : [formatearDuracion(numValue), nameStr]
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(name) => {
                        if (name === 'total') return 'Total'
                        const asig = asignaturasConDatos.find((a) => `asig_${a.id}` === name)
                        return asig?.nombre ?? name
                      }}
                    />
                    {asignaturasConDatos
                      .filter((a) => asignaturasSeleccionadas.length === 0 || asignaturasSeleccionadas.includes(a.id))
                      .map((asignatura) => {
                        const color = asignatura.color
                        const dataKey = `asig_${asignatura.id}`
                        return (
                          <Line
                            key={dataKey}
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            connectNulls
                          />
                        )
                      })}
                    {asignaturasConDatos.length > 1 && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--primario)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls
                      />
                    )}
                  </LineChart>
                ) : tipoGrafico === 'area' ? (
                  <ComposedChart data={datosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" vertical={false} />
                    <XAxis
                      dataKey={vista === 'semana' ? 'dia' : vista === 'mes' ? 'semana' : 'mes'}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                      tickFormatter={(value) => formatearDuracion(value)}
                      domain={[0, 'dataMax + 10']}
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
                        if (nameStr === 'total') return [formatearDuracion(numValue), 'Total']
                        const asig = asignaturasConDatos.find((a) => `asig_${a.id}` === nameStr)
                        return asig ? [formatearDuracion(numValue), asig.nombre] : [formatearDuracion(numValue), nameStr]
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(name) => {
                        if (name === 'total') return 'Total'
                        const asig = asignaturasConDatos.find((a) => `asig_${a.id}` === name)
                        return asig?.nombre ?? name
                      }}
                    />
                    {asignaturasConDatos
                      .filter((a) => asignaturasSeleccionadas.length === 0 || asignaturasSeleccionadas.includes(a.id))
                      .map((asignatura) => {
                        const color = asignatura.color
                        const dataKey = `asig_${asignatura.id}`
                        return (
                          <Area
                            key={dataKey}
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.15}
                            strokeWidth={2}
                            connectNulls
                          />
                        )
                      })}
                    {asignaturasConDatos.length > 1 && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--primario)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls
                      />
                    )}
                  </ComposedChart>
                ) : (
                  <ComposedChart data={datosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" horizontal={false} />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--texto-suave)', fontSize: 11 }}
                      domain={[0, 'dataMax + 10']}
                    />
                    <YAxis
                      dataKey={vista === 'semana' ? 'dia' : vista === 'mes' ? 'semana' : 'mes'}
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
                        if (nameStr === 'total') return [formatearDuracion(numValue), 'Total']
                        const asig = asignaturasConDatos.find((a) => `asig_${a.id}` === nameStr)
                        return asig ? [formatearDuracion(numValue), asig.nombre] : [formatearDuracion(numValue), nameStr]
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(name) => {
                        if (name === 'total') return 'Total'
                        const asig = asignaturasConDatos.find((a) => `asig_${a.id}` === name)
                        return asig?.nombre ?? name
                      }}
                    />
                    {asignaturasConDatos
                      .filter((a) => asignaturasSeleccionadas.length === 0 || asignaturasSeleccionadas.includes(a.id))
                      .map((asignatura) => {
                        const color = asignatura.color
                        const dataKey = `asig_${asignatura.id}`
                        return (
                          <Bar
                            key={dataKey}
                            dataKey={dataKey}
                            fill={color}
                            radius={[0, 4, 4, 0]}
                            maxBarSize={40}
                          />
                        )
                      })}
                    {asignaturasConDatos.length > 1 && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--primario)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls
                      />
                    )}
                  </ComposedChart>
                )}
              </>
            )}
          </ResponsiveContainer>
        </div>

        {/* Leyenda asignaturas */}
        {vista !== 'asignaturas' && asignaturasConDatos.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--texto-suave)]">
            {asignaturasConDatos
              .filter((a) => asignaturasSeleccionadas.length === 0 || asignaturasSeleccionadas.includes(a.id))
              .map((asignatura) => {
                const totalAsig = sesiones
                  .filter((s) => s.asignaturaId === asignatura.id)
                  .reduce((sum, s) => sum + s.duracionMinutos, 0)
                return (
                  <span key={asignatura.id} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: asignatura.color }}
                    />
                    {asignatura.nombre}: {formatearDuracion(totalAsig)}
                  </span>
                )
              })}
          </div>
        )}

        {/* Tabla resumen por asignatura (cuando no es vista asignaturas) */}
        {vista !== 'asignaturas' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="text-left text-[var(--texto-suave)] border-b border-[var(--borde)]">
                  <th className="pb-2 font-medium">Asignatura</th>
                  <th className="pb-2 font-medium text-right">Tiempo total</th>
                  <th className="pb-2 font-medium text-right">Sesiones</th>
                  <th className="pb-2 font-medium text-right">Promedio/sesión</th>
                  <th className="pb-2 font-medium text-right">% del total</th>
                </tr>
              </thead>
              <tbody>
                {datosPorAsignatura.map((item) => (
                  <tr key={item.nombre} className="border-b border-[var(--borde)]/50">
                    <td className="py-2 flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.nombre}
                    </td>
                    <td className="py-2 text-right font-medium">{formatearDuracion(item.valor)}</td>
                    <td className="py-2 text-right text-[var(--texto-suave)]">{item.numSesiones}</td>
                    <td className="py-2 text-right text-[var(--texto-suave)]">{formatearDuracion(item.promedio)}</td>
                    <td className="py-2 text-right font-medium text-[var(--primario)]">{item.porcentaje}%</td>
                  </tr>
                ))}
                <tr className="font-semibold border-t border-[var(--borde)]">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{formatearDuracion(totalGeneral)}</td>
                  <td className="py-2 text-right">{sesiones.length}</td>
                  <td className="py-2 text-right">
                    {sesiones.length > 0 ? formatearDuracion(Math.round(totalGeneral / sesiones.length)) : '—'}
                  </td>
                  <td className="py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}