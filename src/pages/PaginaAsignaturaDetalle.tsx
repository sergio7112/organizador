import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, BookOpen, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import type { EstadoTema } from '../domain/types'
import { ESTADOS_TEMA, ETIQUETAS_ESTADO_TEMA } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { formatearNota } from '../lib/format'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { BarraProgreso } from '../components/ui/BarraProgreso'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { EtiquetaEstadoTema } from '../components/ui/Etiquetas'
import { Entrada, Selector } from '../components/ui/Campos'
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion'
import { ModalAsignatura } from '../components/subjects/ModalAsignatura'
import { ModalTema } from '../components/subjects/ModalTema'
import { ModalError } from '../components/errors/ModalError'

export function PaginaAsignaturaDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const datos = useAppStore((estado) => estado.datos)
  const crearTema = useAppStore((estado) => estado.crearTema)
  const actualizarTema = useAppStore((estado) => estado.actualizarTema)
  const eliminarTema = useAppStore((estado) => estado.eliminarTema)
  const eliminarAsignatura = useAppStore((estado) => estado.eliminarAsignatura)

  const [modalEditar, setModalEditar] = useState(false)
  const [temaEditando, setTemaEditando] = useState<string | null>(null)
  const [confirmarAsignatura, setConfirmarAsignatura] = useState(false)
  const [temaAEliminar, setTemaAEliminar] = useState<string | null>(null)
  const [errorTema, setErrorTema] = useState<string | null>(null)
  const [nuevoTema, setNuevoTema] = useState('')

  const asignatura = datos.asignaturas.find((item) => item.id === id)

  const temas = useMemo(
    () =>
      datos.temas
        .filter((tema) => tema.asignaturaId === id)
        .sort((a, b) => a.orden - b.orden),
    [datos.temas, id],
  )

  const erroresAbiertos = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const error of datos.errores) {
      if (!error.resuelto) {
        cuenta.set(error.temaId, (cuenta.get(error.temaId) ?? 0) + 1)
      }
    }
    return cuenta
  }, [datos.errores])

  if (!asignatura) {
    return (
      <>
        <CabeceraPagina
          titulo="Asignatura no encontrada"
          volver={{ ruta: '/asignaturas', etiqueta: 'Asignaturas' }}
        />
        <EstadoVacio
          icono={BookOpen}
          titulo="No existe esta asignatura"
          descripcion="Puede que se haya eliminado o que el enlace no sea correcto."
        />
      </>
    )
  }

  const dominados = temas.filter((tema) => tema.estado === 'dominado').length
  const repasados = temas.filter((tema) => tema.estado === 'repasado').length
  const estudiando = temas.filter((tema) => tema.estado === 'estudiando').length
  const sinEmpezar = temas.filter((tema) => tema.estado === 'sin_empezar').length
  const porcentaje = temas.length === 0 ? 0 : Math.round((dominados / temas.length) * 100)
  const temaEditado = temas.find((tema) => tema.id === temaEditando)

  const anadirTema = (evento: FormEvent) => {
    evento.preventDefault()
    if (!nuevoTema.trim()) return
    crearTema({ asignaturaId: asignatura.id, titulo: nuevoTema })
    setNuevoTema('')
  }

  const estadisticas = [
    { etiqueta: 'Dominados', valor: dominados },
    { etiqueta: 'Repasados', valor: repasados },
    { etiqueta: 'Estudiando', valor: estudiando },
    { etiqueta: 'Sin empezar', valor: sinEmpezar },
  ]

  return (
    <>
      <CabeceraPagina
        volver={{ ruta: '/asignaturas', etiqueta: 'Asignaturas' }}
        titulo={asignatura.nombre}
        descripcion={`${temas.length} ${temas.length === 1 ? 'tema' : 'temas'} · ${porcentaje} % dominado`}
        accion={
          <div className="flex items-center gap-2">
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => setModalEditar(true)}
            >
              <Pencil size={15} />
              Editar
            </Boton>
            <Boton
              variante="fantasma"
              tamano="icono"
              onClick={() => setConfirmarAsignatura(true)}
              aria-label="Eliminar asignatura"
              className="text-[var(--peligro)]"
            >
              <Trash2 size={18} />
            </Boton>
          </div>
        }
      />

      <Tarjeta className="mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tabular-nums">{porcentaje}%</span>
            <span className="text-sm text-[var(--texto-suave)]">dominado</span>
          </div>
          <div className="min-w-40 flex-1">
            <BarraProgreso
              valor={porcentaje}
              etiqueta={`Temario dominado de ${asignatura.nombre}`}
            />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {estadisticas.map((dato) => (
            <div
              key={dato.etiqueta}
              className="rounded-xl bg-[var(--superficie-2)] px-3 py-2"
            >
              <dt className="text-[11px] text-[var(--texto-suave)]">{dato.etiqueta}</dt>
              <dd className="mt-0.5 text-lg font-semibold leading-none tabular-nums">
                {dato.valor}
              </dd>
            </div>
          ))}
        </dl>
      </Tarjeta>

      <Tarjeta className="mb-4 p-3">
        <form onSubmit={anadirTema} className="flex gap-2">
          <Entrada
            value={nuevoTema}
            onChange={(evento) => setNuevoTema(evento.target.value)}
            placeholder="Añadir un tema al temario…"
            aria-label="Título del nuevo tema"
          />
          <Boton type="submit" disabled={!nuevoTema.trim()}>
            <Plus size={17} />
            Añadir
          </Boton>
        </form>
      </Tarjeta>

      {temas.length === 0 ? (
        <EstadoVacio
          icono={BookOpen}
          titulo="El temario está vacío"
          descripcion="Añade los temas de esta asignatura para empezar a controlar tu progreso."
        />
      ) : (
        <Tarjeta className="overflow-hidden">
          <ul className="divide-y divide-[var(--borde)]">
            {temas.map((tema) => {
              const errores = erroresAbiertos.get(tema.id) ?? 0
              return (
                <li
                  key={tema.id}
                  className="flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setTemaEditando(tema.id)}
                      className="text-left text-sm font-medium hover:underline"
                    >
                      {tema.titulo}
                    </button>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <EtiquetaEstadoTema estado={tema.estado} />
                      {tema.nota !== undefined && (
                        <span className="text-xs text-[var(--texto-suave)]">
                          Nota {formatearNota(tema.nota)}
                        </span>
                      )}
                      {errores > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--aviso)]">
                          <AlertCircle size={12} />
                          {errores} {errores === 1 ? 'error abierto' : 'errores abiertos'}
                        </span>
                      )}
                      {tema.estado === 'dominado' && (
                        <CheckCircle2 size={13} className="text-[var(--exito)]" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Selector
                      aria-label={`Estado de ${tema.titulo}`}
                      value={tema.estado}
                      onChange={(evento) =>
                        actualizarTema(tema.id, {
                          estado: evento.target.value as EstadoTema,
                        })
                      }
                      className="h-9 w-36 text-xs"
                    >
                      {ESTADOS_TEMA.map((estado) => (
                        <option key={estado} value={estado}>
                          {ETIQUETAS_ESTADO_TEMA[estado]}
                        </option>
                      ))}
                    </Selector>
                    <Boton
                      variante="fantasma"
                      tamano="icono"
                      onClick={() => setErrorTema(tema.id)}
                      aria-label={`Anotar un error de ${tema.titulo}`}
                      className="size-9 text-[var(--aviso)]"
                    >
                      <AlertCircle size={16} />
                    </Boton>
                    <Boton
                      variante="fantasma"
                      tamano="icono"
                      onClick={() => setTemaEditando(tema.id)}
                      aria-label={`Editar ${tema.titulo}`}
                      className="size-9"
                    >
                      <Pencil size={16} />
                    </Boton>
                    <Boton
                      variante="fantasma"
                      tamano="icono"
                      onClick={() => setTemaAEliminar(tema.id)}
                      aria-label={`Eliminar ${tema.titulo}`}
                      className="size-9 hover:text-[var(--peligro)]"
                    >
                      <Trash2 size={16} />
                    </Boton>
                  </div>
                </li>
              )
            })}
          </ul>
        </Tarjeta>
      )}

      {temas.length > 0 && (
        <p className="mt-3 text-xs text-[var(--texto-suave)]">
          Al cambiar un tema a «Estudiando» se programan repasos a 1, 3 y 7 días.
        </p>
      )}

      <ModalAsignatura
        abierto={modalEditar}
        asignatura={asignatura}
        onCerrar={() => setModalEditar(false)}
      />

      <ModalTema
        abierto={temaEditando !== null}
        asignaturaId={asignatura.id}
        tema={temaEditado}
        onCerrar={() => setTemaEditando(null)}
      />

      <ModalError
        abierto={errorTema !== null}
        temaInicial={errorTema ?? undefined}
        onCerrar={() => setErrorTema(null)}
      />

      <DialogoConfirmacion
        abierto={confirmarAsignatura}
        titulo="Eliminar asignatura"
        mensaje={`Se eliminarán «${asignatura.nombre}», sus temas y sus exámenes. Las tareas vinculadas se conservarán sin asignatura.`}
        onCerrar={() => setConfirmarAsignatura(false)}
        onConfirmar={() => {
          eliminarAsignatura(asignatura.id)
          navegar('/asignaturas')
        }}
      />

      <DialogoConfirmacion
        abierto={temaAEliminar !== null}
        titulo="Eliminar tema"
        mensaje="Se eliminará el tema junto con sus repasos y errores registrados."
        onCerrar={() => setTemaAEliminar(null)}
        onConfirmar={() => {
          if (temaAEliminar) eliminarTema(temaAEliminar)
        }}
      />
    </>
  )
}
