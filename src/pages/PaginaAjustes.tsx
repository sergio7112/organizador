import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Database, Download, Monitor, Moon, Sun, Upload } from 'lucide-react'
import type { Datos, TemaOscuro } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import {
  ErrorImportacion,
  descargarArchivo,
  exportarDatos,
  importarDatos,
  nombreCopiaSeguridad,
} from '../lib/sync'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Boton } from '../components/ui/Boton'
import { ControlSegmentado } from '../components/ui/ControlSegmentado'
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion'
import { CuentaOnline } from '../components/CuentaOnline'

const OPCIONES_TEMA = [
  { valor: 'claro' as const, etiqueta: 'Claro' },
  { valor: 'oscuro' as const, etiqueta: 'Oscuro' },
  { valor: 'sistema' as const, etiqueta: 'Sistema' },
]

export function PaginaAjustes() {
  const datos = useAppStore((estado) => estado.datos)
  const cambiarAjustes = useAppStore((estado) => estado.cambiarAjustes)
  const reemplazarDatos = useAppStore((estado) => estado.reemplazarDatos)
  const [importacion, setImportacion] = useState<Datos | null>(null)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)
  const archivoRef = useRef<HTMLInputElement>(null)

  const exportar = () => {
    try {
      descargarArchivo(nombreCopiaSeguridad(), exportarDatos(datos))
      setMensaje({
        tipo: 'ok',
        texto: 'Copia de seguridad descargada. Guárdala en un lugar seguro.',
      })
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'No se pudo generar el archivo de copia de seguridad.',
      })
    }
  }

  const elegirArchivo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return

    setMensaje(null)
    try {
      const texto = await archivo.text()
      setImportacion(importarDatos(texto))
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto:
          error instanceof ErrorImportacion
            ? error.message
            : 'No se pudo leer el archivo seleccionado.',
      })
    }
  }

  return (
    <>
      <CabeceraPagina
        titulo="Ajustes"
        descripcion="Apariencia y datos de la aplicación"
      />

      <CuentaOnline />

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Apariencia</h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Elige el tema de la interfaz. «Sistema» sigue la preferencia del
          dispositivo.
        </p>
        <div className="mt-3">
          <ControlSegmentado<TemaOscuro>
            ariaLabel="Tema de la interfaz"
            valor={datos.ajustes.tema}
            opciones={OPCIONES_TEMA}
            onChange={(tema) => cambiarAjustes({ tema })}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--texto-suave)]">
          <span className="inline-flex items-center gap-1.5">
            <Sun size={14} /> Claro
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Moon size={14} /> Oscuro
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Monitor size={14} /> Sistema
          </span>
        </div>
      </Tarjeta>

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database size={16} />
          Datos
        </h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Los cambios se guardan en este navegador, incluso sin conexión. Usa el almacenamiento online para conservar una copia en tu cuenta. Hay{' '}
          {datos.asignaturas.length} asignaturas, {datos.temas.length} temas y{' '}
          {datos.tareas.length} tareas guardadas.
        </p>
        <p className="mt-3 rounded-xl bg-[var(--superficie-2)] px-3 py-2 text-xs text-[var(--texto-suave)]">
          La aplicación arranca vacía. Crea tus asignaturas, tareas, exámenes y
          proyectos desde el menú.
        </p>
      </Tarjeta>

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Download size={16} />
          Copia de seguridad
        </h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Exporta todo tu contenido a un archivo JSON o impórtalo en otro
          dispositivo. La importación sustituye los datos que tengas en este
          navegador.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Boton onClick={exportar}>
            <Download size={16} />
            Exportar JSON
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => archivoRef.current?.click()}
          >
            <Upload size={16} />
            Importar JSON
          </Boton>
          <input
            ref={archivoRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={elegirArchivo}
          />
        </div>
        {mensaje && (
          <p
            role={mensaje.tipo === 'error' ? 'alert' : 'status'}
            className={
              mensaje.tipo === 'error'
                ? 'mt-3 rounded-xl bg-[var(--peligro-suave)] px-3 py-2 text-sm text-[var(--peligro)]'
                : 'mt-3 rounded-xl bg-[var(--exito-suave)] px-3 py-2 text-sm text-[var(--exito)]'
            }
          >
            {mensaje.texto}
          </p>
        )}
      </Tarjeta>

      <Tarjeta className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Acerca de</h2>
        <dl className="mt-2 grid gap-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--texto-suave)]">Versión</dt>
            <dd>0.2.0</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--texto-suave)]">Curso</dt>
            <dd>2.º de Bachillerato</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--texto-suave)]">Almacenamiento</dt>
            <dd>Local y copia online opcional</dd>
          </div>
        </dl>
      </Tarjeta>

      <DialogoConfirmacion
        abierto={importacion !== null}
        titulo="Importar copia de seguridad"
        mensaje={
          importacion
            ? `Se sustituirán los datos actuales por ${importacion.asignaturas.length} asignaturas, ${importacion.temas.length} temas, ${importacion.tareas.length} tareas y ${importacion.proyectos.length} proyectos.`
            : ''
        }
        textoConfirmar="Importar"
        peligro={false}
        onCerrar={() => setImportacion(null)}
        onConfirmar={() => {
          if (!importacion) return
          reemplazarDatos(importacion)
          setMensaje({
            tipo: 'ok',
            texto: 'Copia de seguridad importada correctamente.',
          })
        }}
      />
    </>
  )
}
