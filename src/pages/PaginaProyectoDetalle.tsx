import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, FolderKanban, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/format'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { BarraProgreso } from '../components/ui/BarraProgreso'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { ControlSegmentado } from '../components/ui/ControlSegmentado'
import { Entrada, AreaTexto } from '../components/ui/Campos'
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion'
import { ModalProyecto } from '../components/projects/ModalProyecto'
import { ListaTareas } from '../components/tasks/ListaTareas'
import { ModalTarea } from '../components/tasks/ModalTarea'

const OPCIONES_NOTAS = [
  { valor: 'escribir' as const, etiqueta: 'Escribir' },
  { valor: 'vista' as const, etiqueta: 'Vista previa' },
]

export function PaginaProyectoDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const datos = useAppStore((estado) => estado.datos)
  const eliminarProyecto = useAppStore((estado) => estado.eliminarProyecto)
  const crearItemChecklist = useAppStore((estado) => estado.crearItemChecklist)
  const actualizarItemChecklist = useAppStore(
    (estado) => estado.actualizarItemChecklist,
  )
  const eliminarItemChecklist = useAppStore(
    (estado) => estado.eliminarItemChecklist,
  )

  const [modalEditar, setModalEditar] = useState(false)
  const [modalTarea, setModalTarea] = useState(false)
  const [confirmarProyecto, setConfirmarProyecto] = useState(false)
  const [itemAEliminar, setItemAEliminar] = useState<string | null>(null)
  const [nuevoPaso, setNuevoPaso] = useState('')
  const [vistaNotas, setVistaNotas] = useState<'escribir' | 'vista'>('escribir')

  const proyecto = datos.proyectos.find((item) => item.id === id)

  // Las notas se editan en local y se guardan poco después de dejar de escribir,
  // para no escribir en el almacén (y sincronizar) en cada pulsación.
  const [notas, setNotas] = useState(proyecto?.notasMarkdown ?? '')
  const notasRef = useRef(notas)
  const notasGuardadasRef = useRef(proyecto?.notasMarkdown ?? '')
  const temporizadorNotas = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idProyecto = proyecto?.id

  useEffect(() => {
    const iniciales = proyecto?.notasMarkdown ?? ''
    setNotas(iniciales)
    notasRef.current = iniciales
    notasGuardadasRef.current = iniciales

    return () => {
      if (temporizadorNotas.current) {
        clearTimeout(temporizadorNotas.current)
        temporizadorNotas.current = null
      }
      if (idProyecto && notasRef.current !== notasGuardadasRef.current) {
        useAppStore.getState().actualizarProyecto(idProyecto, {
          notasMarkdown: notasRef.current,
        })
      }
    }
    // Solo se reinicia al cambiar de proyecto; al escribir manda el estado local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProyecto])

  const cambiarNotas = (valor: string) => {
    setNotas(valor)
    notasRef.current = valor
    if (!idProyecto) return
    if (temporizadorNotas.current) clearTimeout(temporizadorNotas.current)
    temporizadorNotas.current = setTimeout(() => {
      temporizadorNotas.current = null
      notasGuardadasRef.current = valor
      useAppStore.getState().actualizarProyecto(idProyecto, {
        notasMarkdown: valor,
      })
    }, 500)
  }

  const items = useMemo(
    () =>
      datos.checklist
        .filter((item) => item.proyectoId === id)
        .sort((a, b) => a.orden - b.orden),
    [datos.checklist, id],
  )

  const tareas = useMemo(
    () =>
      datos.tareas
        .filter(
          (tarea) =>
            tarea.vinculo?.tipo === 'proyecto' && tarea.vinculo.id === id,
        )
        .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite)),
    [datos.tareas, id],
  )

  if (!proyecto) {
    return (
      <>
        <CabeceraPagina
          titulo="Proyecto no encontrado"
          volver={{ ruta: '/proyectos', etiqueta: 'Proyectos' }}
        />
        <EstadoVacio
          icono={FolderKanban}
          titulo="No existe este proyecto"
          descripcion="Puede que se haya eliminado o que el enlace no sea correcto."
        />
      </>
    )
  }

  const hechos = items.filter((item) => item.hecho).length
  const porcentaje =
    items.length === 0 ? 0 : Math.round((hechos / items.length) * 100)
  const tareasActivas = tareas.filter((tarea) => tarea.estado !== 'hecha').length

  const anadirPaso = (evento: FormEvent) => {
    evento.preventDefault()
    if (!nuevoPaso.trim()) return
    crearItemChecklist(proyecto.id, nuevoPaso)
    setNuevoPaso('')
  }

  return (
    <>
      <CabeceraPagina
        volver={{ ruta: '/proyectos', etiqueta: 'Proyectos' }}
        titulo={proyecto.nombre}
        descripcion={
          proyecto.descripcion ??
          `${items.length} pasos · ${tareasActivas} tareas activas`
        }
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
              onClick={() => setConfirmarProyecto(true)}
              aria-label="Eliminar proyecto"
              className="text-[var(--peligro)]"
            >
              <Trash2 size={18} />
            </Boton>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Tarjeta className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <ListChecks size={16} />
              Checklist
            </h2>
            <span className="text-xs tabular-nums text-[var(--texto-suave)]">
              {hechos} de {items.length}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <BarraProgreso
              valor={porcentaje}
              etiqueta={`Checklist de ${proyecto.nombre}`}
            />
            <span className="w-9 text-right text-xs font-medium tabular-nums">
              {porcentaje}%
            </span>
          </div>

          {items.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[var(--borde)] px-3 py-4 text-center text-sm text-[var(--texto-suave)]">
              Añade el primer paso del proyecto.
            </p>
          ) : (
            <ul className="mt-3 -mx-1">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-lg px-1 py-1.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={item.hecho}
                    aria-label={
                      item.hecho
                        ? `Marcar «${item.texto}» como pendiente`
                        : `Marcar «${item.texto}» como hecho`
                    }
                    onClick={() =>
                      actualizarItemChecklist(item.id, { hecho: !item.hecho })
                    }
                    className={cn(
                      'relative mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors after:absolute after:-inset-2 after:content-[""]',
                      item.hecho
                        ? 'border-[var(--exito)] bg-[var(--exito)] text-[var(--primario-contraste)]'
                        : 'border-[var(--borde)] hover:border-[var(--primario)]',
                    )}
                  >
                    {item.hecho && <Check size={12} strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      'min-w-0 flex-1 text-sm leading-snug',
                      item.hecho && 'text-[var(--texto-suave)] line-through',
                    )}
                  >
                    {item.texto}
                  </span>
                  <Boton
                    variante="fantasma"
                    tamano="icono"
                    onClick={() => setItemAEliminar(item.id)}
                    aria-label={`Eliminar ${item.texto}`}
                    className="size-8 hover:text-[var(--peligro)]"
                  >
                    <Trash2 size={14} />
                  </Boton>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={anadirPaso} className="mt-3 flex gap-2">
            <Entrada
              value={nuevoPaso}
              onChange={(evento) => setNuevoPaso(evento.target.value)}
              placeholder="Añadir un paso…"
              aria-label="Nuevo paso del checklist"
            />
            <Boton type="submit" disabled={!nuevoPaso.trim()} aria-label="Añadir paso">
              <Plus size={17} />
            </Boton>
          </form>
        </Tarjeta>

        <Tarjeta className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Notas</h2>
            <ControlSegmentado
              ariaLabel="Vista de las notas"
              valor={vistaNotas}
              opciones={OPCIONES_NOTAS}
              onChange={setVistaNotas}
            />
          </div>

          {vistaNotas === 'escribir' ? (
            <AreaTexto
              value={notas}
              onChange={(evento) => cambiarNotas(evento.target.value)}
              placeholder={
                '# Título\n\nEscribe tus notas con **Markdown**: listas, enlaces, código…'
              }
              aria-label="Notas del proyecto en Markdown"
              className="mt-3 min-h-72 font-mono text-[13px] leading-relaxed"
            />
          ) : (
            <div className="prosa mt-3 min-h-72">
              {notas.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notas}
                </ReactMarkdown>
              ) : (
                <p className="text-[var(--texto-suave)]">
                  Aún no hay notas. Cambia a «Escribir» para empezar.
                </p>
              )}
            </div>
          )}

          <p className="mt-2 text-xs text-[var(--texto-suave)]">
            Los cambios se guardan automáticamente en este dispositivo.
          </p>
        </Tarjeta>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Tareas del proyecto
            {tareasActivas > 0 && (
              <span className="ml-1.5 text-sm font-normal text-[var(--texto-suave)]">
                ({tareasActivas})
              </span>
            )}
          </h2>
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setModalTarea(true)}
          >
            <Plus size={15} />
            Nueva tarea
          </Boton>
        </div>

        <ListaTareas
          tareas={tareas}
          accionVacio={
            <Boton variante="secundario" onClick={() => setModalTarea(true)}>
              <Plus size={16} />
              Añadir una tarea al proyecto
            </Boton>
          }
        />
      </section>

      <ModalProyecto
        abierto={modalEditar}
        proyecto={proyecto}
        onCerrar={() => setModalEditar(false)}
      />

      <ModalTarea
        abierto={modalTarea}
        proyectoInicial={proyecto.id}
        onCerrar={() => setModalTarea(false)}
      />

      <DialogoConfirmacion
        abierto={confirmarProyecto}
        titulo="Eliminar proyecto"
        mensaje={`Se eliminará «${proyecto.nombre}», su checklist y sus notas. Las tareas vinculadas se conservarán sin proyecto.`}
        onCerrar={() => setConfirmarProyecto(false)}
        onConfirmar={() => {
          eliminarProyecto(proyecto.id)
          navegar('/proyectos')
        }}
      />

      <DialogoConfirmacion
        abierto={itemAEliminar !== null}
        titulo="Eliminar paso"
        mensaje="Se eliminará este paso del checklist del proyecto."
        onCerrar={() => setItemAEliminar(null)}
        onConfirmar={() => {
          if (itemAEliminar) eliminarItemChecklist(itemAEliminar)
        }}
      />
    </>
  )
}
