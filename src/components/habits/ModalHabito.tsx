import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { SelectorColor } from '../ui/SelectorColor'
import { ControlSegmentado } from '../ui/ControlSegmentado'
import { cn } from '../../lib/format'
import { PALETA } from '../../domain/colors'
import type { EntradaHabito, FrecuenciaHabito } from '../../domain/types'

interface ModalHabitoProps {
  abierto: boolean
  onCerrar: () => void
  onGuardar: (datos: EntradaHabito) => void
  habitoExistente?: EntradaHabito & { id: string }
  coloresAsignados: string[]
}

const FRECUENCIAS: { valor: FrecuenciaHabito; etiqueta: string }[] = [
  { valor: 'diaria', etiqueta: 'Diaria' },
  { valor: 'semanal', etiqueta: 'Semanal' },
  { valor: 'mensual', etiqueta: 'Mensual' },
  { valor: 'personalizada', etiqueta: 'Personalizada' },
]

const DIAS_SEMANA = [
  { valor: 0, corto: 'D', largo: 'Domingo' },
  { valor: 1, corto: 'L', largo: 'Lunes' },
  { valor: 2, corto: 'M', largo: 'Martes' },
  { valor: 3, corto: 'X', largo: 'Miércoles' },
  { valor: 4, corto: 'J', largo: 'Jueves' },
  { valor: 5, corto: 'V', largo: 'Viernes' },
  { valor: 6, corto: 'S', largo: 'Sábado' },
]

export function ModalHabito({
  abierto,
  onCerrar,
  onGuardar,
  habitoExistente,
  coloresAsignados,
}: ModalHabitoProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [color, setColor] = useState<string>(PALETA[0].valor)
  const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>('diaria')
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [diaMes, setDiaMes] = useState<number | undefined>(undefined)
  const [objetivo, setObjetivo] = useState<string>('')
  const [unidad, setUnidad] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Evita reiniciar el formulario cuando el padre crea una nueva lista de colores.
  const claveColores = coloresAsignados.join('|')

  useEffect(() => {
    if (abierto) {
      if (habitoExistente) {
        setNombre(habitoExistente.nombre)
        setDescripcion(habitoExistente.descripcion ?? '')
        setColor(habitoExistente.color)
        setFrecuencia(habitoExistente.frecuencia)
        setDiasSemana(habitoExistente.diasSemana ?? [])
        setDiaMes(habitoExistente.diaMes)
        setObjetivo(habitoExistente.objetivo?.toString() ?? '')
        setUnidad(habitoExistente.unidad ?? '')
      } else {
        setNombre('')
        setDescripcion('')
        setColor(PALETA.find((c) => !coloresAsignados.includes(c.valor))?.valor ?? PALETA[0].valor)
        setFrecuencia('diaria')
        setDiasSemana([])
        setDiaMes(undefined)
        setObjetivo('')
        setUnidad('')
      }
      setError(null)
    }
    // `claveColores` resume el contenido de `coloresAsignados`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, habitoExistente, claveColores])

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (frecuencia === 'semanal' && diasSemana.length === 0) {
      setError('Selecciona al menos un día de la semana')
      return
    }
    if (frecuencia === 'mensual' && !diaMes) {
      setError('Selecciona un día del mes')
      return
    }
    if (frecuencia === 'personalizada' && diasSemana.length === 0) {
      setError('Selecciona al menos un día')
      return
    }

    onGuardar({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      color,
      frecuencia,
      diasSemana: ['semanal', 'personalizada'].includes(frecuencia) ? diasSemana : undefined,
      diaMes: frecuencia === 'mensual' ? diaMes : undefined,
      objetivo: objetivo ? parseInt(objetivo, 10) : undefined,
      unidad: unidad.trim() || undefined,
    })
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={habitoExistente ? 'Editar hábito' : 'Nuevo hábito'}
    >
      <form onSubmit={manejarEnvio} className="grid gap-4">
        <Campo etiqueta="Nombre" obligatorio>
          <input
            type="text"
            placeholder="Ej: Beber agua, Leer, Ejercicio..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
            autoFocus
          />
          {error && <p className="text-sm text-[var(--peligro)]">{error}</p>}
        </Campo>

        <Campo etiqueta="Descripción (opcional)">
          <textarea
            placeholder="Detalles, motivación, notas..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5 resize-none"
          />
        </Campo>

        <SelectorColor
          valor={color}
          onChange={setColor}
        />

        <Campo etiqueta="Frecuencia">
          <ControlSegmentado
            valor={frecuencia}
            onChange={setFrecuencia}
            opciones={FRECUENCIAS}
            ariaLabel="Frecuencia del hábito"
          />
        </Campo>

        {frecuencia === 'semanal' && (
          <Campo etiqueta="Días de la semana">
            <div className="flex gap-2 flex-wrap" role="group" aria-label="Días de la semana">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.valor}
                  type="button"
                  onClick={() =>
                    setDiasSemana((prev) =>
                      prev.includes(dia.valor)
                        ? prev.filter((d) => d !== dia.valor)
                        : [...prev, dia.valor],
                    )
                  }
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors',
                    diasSemana.includes(dia.valor)
                      ? 'bg-[var(--primario)] text-[var(--primario-contraste)]'
                      : 'bg-[var(--superficie-2)] text-[var(--texto)] hover:bg-[var(--borde)]',
                  )}
                  aria-pressed={diasSemana.includes(dia.valor)}
                >
                  {dia.corto}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--texto-suave)]">
              {diasSemana.length === 0
                ? 'Selecciona los días en que quieres hacer el hábito'
                : `Días seleccionados: ${diasSemana
                    .map((d) => DIAS_SEMANA.find((ds) => ds.valor === d)?.largo)
                    .join(', ')}`}
            </p>
          </Campo>
        )}

        {frecuencia === 'mensual' && (
          <Campo etiqueta="Día del mes">
            <input
              type="number"
              min={1}
              max={31}
              value={diaMes ?? ''}
              onChange={(e) => setDiaMes(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="1-31"
              className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
            />
          </Campo>
        )}

        {frecuencia === 'personalizada' && (
          <Campo etiqueta="Días personalizados">
            <div className="flex gap-2 flex-wrap" role="group" aria-label="Días personalizados">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.valor}
                  type="button"
                  onClick={() =>
                    setDiasSemana((prev) =>
                      prev.includes(dia.valor)
                        ? prev.filter((d) => d !== dia.valor)
                        : [...prev, dia.valor],
                    )
                  }
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors',
                    diasSemana.includes(dia.valor)
                      ? 'bg-[var(--primario)] text-[var(--primario-contraste)]'
                      : 'bg-[var(--superficie-2)] text-[var(--texto)] hover:bg-[var(--borde)]',
                  )}
                  aria-pressed={diasSemana.includes(dia.valor)}
                >
                  {dia.corto}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--texto-suave)]">
              {diasSemana.length === 0
                ? 'Selecciona los días que componen tu frecuencia personalizada'
                : `Días: ${diasSemana
                    .map((d) => DIAS_SEMANA.find((ds) => ds.valor === d)?.largo)
                    .join(', ')}`}
            </p>
          </Campo>
        )}

        <div className="grid gap-3 pt-2">
          <Campo etiqueta="Objetivo numérico (opcional)" ayuda="Si el hábito tiene un contador (páginas, vasos, km...)">
            <input
              type="number"
              min={1}
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ej: 20"
              className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
            />
          </Campo>
          <Campo etiqueta="Unidad (opcional)">
            <input
              type="text"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              placeholder="páginas, vasos, km, min..."
              className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
            />
          </Campo>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Boton variante="secundario" type="button" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit">{habitoExistente ? 'Guardar cambios' : 'Crear hábito'}</Boton>
        </div>
      </form>
    </Modal>
  )
}