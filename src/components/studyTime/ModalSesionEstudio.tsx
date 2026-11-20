import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Boton } from '../ui/Boton'
import { Campo } from '../ui/Campo'
import { hoyISO } from '../../domain/dates'
import type { EntradaSesionEstudio, Asignatura } from '../../domain/types'

interface ModalSesionEstudioProps {
  abierto: boolean
  onCerrar: () => void
  onGuardar: (datos: EntradaSesionEstudio) => void
  sesionExistente?: EntradaSesionEstudio & { id: string }
  asignaturas: Asignatura[]
}

export function ModalSesionEstudio({
  abierto,
  onCerrar,
  onGuardar,
  sesionExistente,
  asignaturas,
}: ModalSesionEstudioProps) {
  const [asignaturaId, setAsignaturaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      if (sesionExistente) {
        setAsignaturaId(sesionExistente.asignaturaId)
        setFecha(sesionExistente.fecha)
        setInicio(sesionExistente.inicio)
        setFin(sesionExistente.fin)
        setNotas(sesionExistente.notas ?? '')
      } else {
        setAsignaturaId(asignaturas[0]?.id ?? '')
        setFecha(hoyISO())
        const ahora = new Date()
        const hora = ahora.getHours().toString().padStart(2, '0')
        const minuto = ahora.getMinutes().toString().padStart(2, '0')
        setFin(`${hora}:${minuto}`)
        const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000)
        setInicio(`${haceUnaHora.getHours().toString().padStart(2, '0')}:${haceUnaHora.getMinutes().toString().padStart(2, '0')}`)
        setNotas('')
      }
      setError(null)
    }
  }, [abierto, sesionExistente, asignaturas])

  const calcularDuracion = () => {
    if (!inicio || !fin) return 0
    const [hi, mi] = inicio.split(':').map(Number)
    const [hf, mf] = fin.split(':').map(Number)
    const inicioMin = hi * 60 + mi
    const finMin = hf * 60 + mf
    return Math.max(0, finMin - inicioMin)
  }

  const duracion = calcularDuracion()
  const duracionTexto = duracion >= 60
    ? `${Math.floor(duracion / 60)}h ${duracion % 60}min`
    : `${duracion}min`

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!asignaturaId) {
      setError('Selecciona una asignatura')
      return
    }
    if (!fecha) {
      setError('Selecciona una fecha')
      return
    }
    if (!inicio || !fin) {
      setError('Indica hora de inicio y fin')
      return
    }
    if (duracion <= 0) {
      setError('La hora de fin debe ser posterior a la de inicio')
      return
    }

    onGuardar({
      asignaturaId,
      fecha,
      inicio,
      fin,
      notas: notas.trim() || undefined,
    })
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={sesionExistente ? 'Editar sesión de estudio' : 'Nueva sesión de estudio'}
    >
      <form onSubmit={manejarEnvio} className="grid gap-4">
        {asignaturas.length === 0 && (
          <p className="rounded-xl bg-[var(--aviso-suave)] p-3 text-sm text-[var(--aviso)]">
            Crea una asignatura antes de registrar sesiones de estudio.
          </p>
        )}

        <Campo etiqueta="Asignatura" obligatorio>
          <select
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5 w-full"
          >
            <option value="">Selecciona una asignatura</option>
            {asignaturas.map((a) => (
              <option key={a.id} value={a.id} style={{ color: a.color }}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Fecha" obligatorio>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            max={hoyISO()}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
          />
        </Campo>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Hora de inicio">
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
            />
          </Campo>
          <Campo etiqueta="Hora de fin">
            <input
              type="time"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5"
            />
          </Campo>
        </div>

        {duracion > 0 && (
          <div className="rounded-xl bg-[var(--primario-suave)] p-3 text-center text-sm font-medium text-[var(--primario)]">
            Duración: <strong>{duracionTexto}</strong>
          </div>
        )}

        <Campo etiqueta="Notas (opcional)">
          <textarea
            placeholder="Qué estudiaste, cómo te sentiste, dificultades..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5 resize-none"
          />
        </Campo>

        {error && <p role="alert" className="text-sm text-[var(--peligro)]">{error}</p>}

        <div className="sticky bottom-0 -mx-5 -mb-4 mt-2 flex justify-end gap-2 border-t border-[var(--borde)] bg-[var(--superficie)] px-5 pt-3 pb-modal">
          <Boton variante="secundario" type="button" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={asignaturas.length === 0}>
            {sesionExistente ? 'Guardar cambios' : 'Añadir sesión'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}