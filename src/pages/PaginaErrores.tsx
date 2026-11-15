import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from 'lucide-react'
import { fechaCorta } from '../domain/dates'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/format'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Selector } from '../components/ui/Campos'
import { Etiqueta, PuntoColor } from '../components/ui/Etiquetas'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion'
import { ModalError } from '../components/errors/ModalError'

export function PaginaErrores() {
  const datos = useAppStore((estado) => estado.datos)
  const actualizarError = useAppStore((estado) => estado.actualizarError)
  const eliminarError = useAppStore((estado) => estado.eliminarError)

  const [asignaturaId, setAsignaturaId] = useState<'todas' | string>('todas')
  const [mostrarResueltos, setMostrarResueltos] = useState(false)
  const [modal, setModal] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const errores = useMemo(() => {
    return datos.errores
      .map((error) => {
        const tema = datos.temas.find((item) => item.id === error.temaId)
        if (!tema) return null
        const asignatura = datos.asignaturas.find(
          (item) => item.id === tema.asignaturaId,
        )
        return { error, tema, asignatura }
      })
      .filter((fila): fila is NonNullable<typeof fila> => fila !== null)
      .filter(
        (fila) =>
          asignaturaId === 'todas' ||
          fila.tema.asignaturaId === asignaturaId,
      )
      .filter((fila) => mostrarResueltos || !fila.error.resuelto)
      .sort(
        (a, b) =>
          Number(a.error.resuelto) - Number(b.error.resuelto) ||
          b.error.fecha.localeCompare(a.error.fecha),
      )
  }, [datos, asignaturaId, mostrarResueltos])

  const abiertos = datos.errores.filter((error) => !error.resuelto).length
  const errorEliminar = datos.errores.find((error) => error.id === eliminando)

  return (
    <>
      <CabeceraPagina
        titulo="Errores"
        descripcion={`${abiertos} ${abiertos === 1 ? 'error abierto' : 'errores abiertos'} · Aprende de lo que falla`}
        accion={
          <Boton onClick={() => setModal(true)}>
            <Plus size={17} />
            Nuevo error
          </Boton>
        }
      />

      <Tarjeta className="mb-5 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Selector
            aria-label="Filtrar errores por asignatura"
            value={asignaturaId}
            onChange={(evento) => setAsignaturaId(evento.target.value)}
            className="h-10 text-sm"
          >
            <option value="todas">Todas las asignaturas</option>
            {datos.asignaturas
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((asignatura) => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </option>
              ))}
          </Selector>

          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--borde)] px-3 text-sm">
            <input
              type="checkbox"
              checked={mostrarResueltos}
              onChange={(evento) => setMostrarResueltos(evento.target.checked)}
              className="size-4 accent-[var(--primario)]"
            />
            Mostrar resueltos
          </label>
        </div>
      </Tarjeta>

      {errores.length === 0 ? (
        <EstadoVacio
          icono={AlertTriangle}
          titulo={
            mostrarResueltos || asignaturaId !== 'todas'
              ? 'No hay errores con estos filtros'
              : 'Todavía no hay errores anotados'
          }
          descripcion="Anota qué falló y por qué para repasarlo antes del examen."
          accion={
            <Boton onClick={() => setModal(true)}>
              <Plus size={16} />
              Anotar un error
            </Boton>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {errores.map(({ error, tema, asignatura }) => (
            <Tarjeta
              key={error.id}
              className={cn('p-4', error.resuelto && 'opacity-70')}
            >
              <div className="flex items-start gap-3">
                <PuntoColor
                  color={asignatura?.color ?? 'var(--primario)'}
                  className="mt-1.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{tema.titulo}</p>
                  <p className="text-xs text-[var(--texto-suave)]">
                    {asignatura?.nombre ?? 'Asignatura'} · {fechaCorta(error.fecha)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Etiqueta tono={error.resuelto ? 'exito' : 'aviso'}>
                    {error.resuelto ? 'Resuelto' : 'Abierto'}
                  </Etiqueta>
                  <Boton
                    variante="fantasma"
                    tamano="icono"
                    onClick={() => setEliminando(error.id)}
                    aria-label="Eliminar error"
                    className="size-8 hover:text-[var(--peligro)]"
                  >
                    <Trash2 size={15} />
                  </Boton>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <div className="rounded-xl bg-[var(--peligro-suave)] px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--peligro)]">
                    Qué falló
                  </p>
                  <p className="mt-0.5 text-sm">{error.queFallo}</p>
                </div>
                {error.porQue && (
                  <div className="rounded-xl bg-[var(--superficie-2)] px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--texto-suave)]">
                      Por qué
                    </p>
                    <p className="mt-0.5 text-sm">{error.porQue}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-end">
                <Boton
                  variante="secundario"
                  tamano="sm"
                  onClick={() =>
                    actualizarError(error.id, { resuelto: !error.resuelto })
                  }
                >
                  {error.resuelto ? (
                    <>
                      <Circle size={14} />
                      Reabrir
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Marcar resuelto
                    </>
                  )}
                </Boton>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      <ModalError abierto={modal} onCerrar={() => setModal(false)} />

      <DialogoConfirmacion
        abierto={eliminando !== null}
        titulo="Eliminar error"
        mensaje={
          errorEliminar
            ? `Se eliminará el error «${errorEliminar.queFallo}».`
            : ''
        }
        onCerrar={() => setEliminando(null)}
        onConfirmar={() => {
          if (eliminando) eliminarError(eliminando)
        }}
      />
    </>
  )
}
