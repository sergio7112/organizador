import { useEffect, useMemo, useState } from 'react'
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

interface AgregadoSesiones {
  /** Minutos por fecha y asignatura, calculados en una sola pasada. */
  porFecha: Map<string, Map<string, number>>
  porAsignatura: Map<string, { minutos: number; sesiones: number }>
}

function agregarSesiones(sesiones: SesionEstudio[]): AgregadoSesiones {
  const porFecha = new Map<string, Map<string, number>>()
  const porAsignatura = new Map<string, { minutos: number; sesiones: number }>()

  for (const sesion of sesiones) {
    let minutosDelDia = porFecha.get(sesion.fecha)
    if (!minutosDelDia) {
      minutosDelDia = new Map()
      porFecha.set(sesion.fecha, minutosDelDia)
    }
    minutosDelDia.set(
      sesion.asignaturaId,
      (minutosDelDia.get(sesion.asignaturaId) ?? 0) + sesion.duracionMinutos,
    )

    const total = porAsignatura.get(sesion.asignaturaId)
    if (total) {
      total.minutos += sesion.duracionMinutos
      total.sesiones += 1
    } else {
      porAsignatura.set(sesion.asignaturaId, {
        minutos: sesion.duracionMinutos,
        sesiones: 1,
      })
    }
  }

  return { porFecha, porAsignatura }
}

function minutosDelDia(
  porFecha: Map<string, Map<string, number>>,
  fecha: string,
  asignaturaId: string,
): number {
  return porFecha.get(fecha)?.get(asignaturaId) ?? 0
}

function minutosEnFechas(
  porFecha: Map<string, Map<string, number>>,
  fechas: string[],
  asignaturaId: string,
): number {
  let minutos = 0
  for (const fecha of fechas) {
    minutos += minutosDelDia(porFecha, fecha, asignaturaId)
  }
  return minutos
}

function generarDatosSemana(
  porFecha: Map<string, Map<string, number>>,
  asignaturas: Asignatura[],
) {
  const hoy = new Date()
  const inicio = startOfWeek(hoy, { weekStartsOn: 1 })
  const fin = endOfWeek(hoy, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin })

  return dias.map((dia) => {
    const fecha = format(dia, 'yyyy-MM-dd')
    const item: Record<string, string | number> = {
      fecha,
      dia: format(dia, 'EEE', { locale: es }),
      total: 0,
    }

    for (const asignatura of asignaturas) {
      const minutos = minutosDelDia(porFecha, fecha, asignatura.id)
      item[`asig_${asignatura.id}`] = minutos
      item.total = (item.total as number) + minutos
    }

    return item
  })
}

function generarDatosMes(
  porFecha: Map<string, Map<string, number>>,
  asignaturas: Asignatura[],
) {
  const hoy = new Date()
  const inicio = startOfMonth(hoy)
  const fin = endOfMonth(hoy)
  const semanas = eachWeekOfInterval({ start: inicio, end: fin }, { weekStartsOn: 1 })

  return semanas.map((semana) => {
    const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 })
    const finSemana = endOfWeek(semana, { weekStartsOn: 1 })
    const fechas = eachDayOfInterval({ start: inicioSemana, end: finSemana }).map(
      (dia) => format(dia, 'yyyy-MM-dd'),
    )
    const item: Record<string, string | number> = {
      semana: format(inicioSemana, 'dd/MM', { locale: es }),
      total: 0,
    }

    for (const asignatura of asignaturas) {
      const minutos = minutosEnFechas(porFecha, fechas, asignatura.id)
      item[`asig_${asignatura.id}`] = minutos
      item.total = (item.total as number) + minutos
    }

    return item
  })
}

function generarDatosAño(
  porFecha: Map<string, Map<string, number>>,
  asignaturas: Asignatura[],
) {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), 0, 1)
  const fin = new Date(hoy.getFullYear(), 11, 31)
  const meses = eachMonthOfInterval({ start: inicio, end: fin })

  return meses.map((mes) => {
    const inicioMes = startOfMonth(mes)
    const finMes = endOfMonth(mes)
    const fechas = eachDayOfInterval({ start: inicioMes, end: finMes }).map(
      (dia) => format(dia, 'yyyy-MM-dd'),
    )
    const item: Record<string, string | number> = {
      mes: format(mes, 'MMM', { locale: es }),
      total: 0,
    }

    for (const asignatura of asignaturas) {
      const minutos = minutosEnFechas(porFecha, fechas, asignatura.id)
      item[`asig_${asignatura.id}`] = minutos
      item.total = (item.total as number) + minutos
    }

    return item
  })
}

function generarDatosPorAsignatura(
  porAsignatura: Map<string, { minutos: number; sesiones: number }>,
  asignaturas: Asignatura[],
) {
  const datos: {
    id: string
    nombre: string
    valor: number
    color: string
    numSesiones: number
    promedio: number
    porcentaje: number
  }[] = []

  for (const asignatura of asignaturas) {
    const total = porAsignatura.get(asignatura.id)
    if (!total) continue
    datos.push({
      id: asignatura.id,
      nombre: asignatura.nombre,
      valor: total.minutos,
      color: asignatura.color,
      numSesiones: total.sesiones,
      promedio:
        total.sesiones > 0 ? Math.round(total.minutos / total.sesiones) : 0,
      porcentaje: 0,
    })
  }

  return datos
}

interface GraficoTiempoEstudioProps {
  sesiones: SesionEstudio[]
  asignaturas: Asignatura[]
}

export function GraficoTiempoEstudio({ sesiones, asignaturas }: GraficoTiempoEstudioProps) {
  const [vista, setVista] = useState<VistaGrafico>('semana')
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('barras')
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<string[]>(
    () => {
      const conDatos = new Set(sesiones.map((s) => s.asignaturaId))
      return asignaturas
        .filter((a) => conDatos.has(a.id))
        .slice(0, 5)
        .map((a) => a.id)
    },
  )

  const agregados = useMemo(() => agregarSesiones(sesiones), [sesiones])

  const asignaturasConDatos = useMemo(
    () => asignaturas.filter((a) => agregados.porAsignatura.has(a.id)),
    [asignaturas, agregados],
  )

  // Al crear asignaturas o sesiones nuevas, la selección inicial debe
  // actualizarse; si no, el gráfico puede quedar vacío hasta recargar.
  useEffect(() => {
    const disponibles = new Set(asignaturasConDatos.map((a) => a.id))
    setAsignaturasSeleccionadas((actuales) => {
      const validas = actuales.filter((id) => disponibles.has(id))
      const nuevas = asignaturasConDatos
        .filter((a) => !validas.includes(a.id))
        .slice(0, Math.max(0, 5 - validas.length))
        .map((a) => a.id)
      const resultado = [...validas, ...nuevas]
      return resultado.length === actuales.length &&
        resultado.every((id, indice) => id === actuales[indice])
        ? actuales
        : resultado
    })
  }, [asignaturasConDatos])

  const datosGrafico = useMemo(() => {
    switch (vista) {
      case 'semana':
        return generarDatosSemana(agregados.porFecha, asignaturasConDatos)
      case 'mes':
        return generarDatosMes(agregados.porFecha, asignaturasConDatos)
      case 'año':
        return generarDatosAño(agregados.porFecha, asignaturasConDatos)
      case 'asignaturas':
        return generarDatosPorAsignatura(
          agregados.porAsignatura,
          asignaturasConDatos,
        )
    }
  }, [vista, agregados, asignaturasConDatos])

  const totalGeneral = useMemo(
    () => sesiones.reduce((sum, s) => sum + s.duracionMinutos, 0),
    [sesiones],
  )

  const datosPorAsignatura = useMemo(() => {
    const arr = generarDatosPorAsignatura(
      agregados.porAsignatura,
      asignaturasConDatos,
    )
    const total = arr.reduce((sum, a) => sum + a.valor, 0)
    return arr.map((a) => ({
      ...a,
      porcentaje: total > 0 ? Math.round((a.valor / total) * 100) : 0,
    }))
  }, [agregados, asignaturasConDatos])

  const totalesPorAsignatura = useMemo(
    () => new Map(datosPorAsignatura.map((item) => [item.id, item.valor])),
    [datosPorAsignatura],
  )

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        <div className="h-96" role="img" aria-label={`Gráfico de tiempo de estudio - ${vista}`}>
          <ResponsiveContainer width="100%" height="100%">
            {vista === 'asignaturas' ? (
              <PieChart>
                <Pie
                  data={datosPorAsignatura}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="72%"
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
                const totalAsig = totalesPorAsignatura.get(asignatura.id) ?? 0
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
                  <tr key={item.id} className="border-b border-[var(--borde)]/50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="min-w-0">{item.nombre}</span>
                      </div>
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