import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Cloud,
  CloudOff,
  Database,
  Download,
  Loader2,
  Monitor,
  Moon,
  RefreshCw,
  Smartphone,
  Sun,
  Upload,
  Bell,
  BellOff,
} from 'lucide-react'
import type { Datos, TemaOscuro } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import {
  useSyncStore,
  type EstadoSync,
} from '../store/useSyncStore'
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
import { Interruptor } from '../components/ui/Interruptor'
import { useInstalacionApp } from '../hooks/useInstalacionApp'
import {
  activarNotificaciones,
  actualizarZona,
  claveConfigurada,
  desactivarNotificaciones,
  enviarPrueba,
  estadoNotificaciones,
  type EstadoNotificaciones,
} from '../lib/notificaciones'

const OPCIONES_TEMA = [
  { valor: 'claro' as const, etiqueta: 'Claro' },
  { valor: 'oscuro' as const, etiqueta: 'Oscuro' },
  { valor: 'sistema' as const, etiqueta: 'Sistema' },
]

const TEXTOS_SYNC: Record<EstadoSync, string> = {
  inactivo: 'Preparando la sincronización…',
  conectando: 'Conectando con Supabase…',
  guardando: 'Guardando cambios…',
  sincronizado: 'Todo sincronizado',
  error: 'No se pudo sincronizar',
  desactivado: 'Sincronización automática desactivada',
  no_disponible: 'Sincronización no disponible en este servidor',
}

function haceCuanto(iso: string | null): string | null {
  if (!iso) return null
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  return formatDistanceToNow(fecha, { addSuffix: true, locale: es })
}

export function PaginaAjustes({ correo }: { correo: string | null }) {
  const datos = useAppStore((estado) => estado.datos)
  const cambiarAjustes = useAppStore((estado) => estado.cambiarAjustes)
  const reemplazarDatos = useAppStore((estado) => estado.reemplazarDatos)
  const estadoSync = useSyncStore((estado) => estado.estado)
  const mensajeSync = useSyncStore((estado) => estado.mensaje)
  const ultimaSync = useSyncStore((estado) => estado.ultimaSincronizacion)
  const sincronizarAhora = useSyncStore((estado) => estado.sincronizarAhora)
  const salir = useAuthStore((estado) => estado.salir)
  const [estadoPush, setEstadoPush] = useState<EstadoNotificaciones | null>(null)
  const [ocupadoPush, setOcupadoPush] = useState(false)
  const [errorPush, setErrorPush] = useState<string | null>(null)
  const [avisoPush, setAvisoPush] = useState<string | null>(null)
  const { puedeInstalar, instalada, resultado, instalar } = useInstalacionApp()
  const [importacion, setImportacion] = useState<Datos | null>(null)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)
  const archivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vigente = true
    void estadoNotificaciones()
      .then((estado) => {
        if (!vigente) return
        setEstadoPush(estado)
        if (estado === 'activas') void actualizarZona()
      })
      .catch(() => {
        if (vigente) setEstadoPush('no-soportado')
      })
    return () => {
      vigente = false
    }
  }, [])

  const cambiarPush = async () => {
    setOcupadoPush(true)
    setErrorPush(null)
    setAvisoPush(null)
    try {
      if (estadoPush === 'activas') {
        await desactivarNotificaciones()
        setEstadoPush('inactivas')
        setAvisoPush('Notificaciones desactivadas en este dispositivo.')
      } else {
        await activarNotificaciones()
        setEstadoPush('activas')
        setAvisoPush('Notificaciones activadas. Envía una prueba para comprobarlo.')
      }
    } catch (error) {
      setErrorPush(
        error instanceof Error ? error.message : 'No se pudieron cambiar las notificaciones.',
      )
      setEstadoPush(await estadoNotificaciones().catch(() => null))
    } finally {
      setOcupadoPush(false)
    }
  }

  const probarPush = async () => {
    setOcupadoPush(true)
    setErrorPush(null)
    setAvisoPush(null)
    try {
      await enviarPrueba()
      setAvisoPush('Aviso de prueba enviado. Debería llegarte en unos segundos.')
    } catch (error) {
      setErrorPush(
        error instanceof Error ? error.message : 'No se pudo enviar el aviso de prueba.',
      )
    } finally {
      setOcupadoPush(false)
    }
  }

  const sincronizacionActiva = datos.ajustes.sincronizacionAutomatica
  const ocupado = estadoSync === 'conectando' || estadoSync === 'guardando'
  const cuando = haceCuanto(ultimaSync)
  const detalleSync =
    estadoSync === 'sincronizado' && cuando
      ? `Última sincronización ${cuando}.`
      : mensajeSync
  const colorSync =
    estadoSync === 'error' || estadoSync === 'no_disponible'
      ? 'text-[var(--peligro)]'
      : estadoSync === 'sincronizado'
        ? 'text-[var(--exito)]'
        : 'text-[var(--texto-suave)]'

  const detallePush =
    estadoPush === 'activas'
      ? 'Este dispositivo está suscrito.'
      : estadoPush === 'bloqueadas'
        ? 'Notificaciones bloqueadas en este navegador.'
        : estadoPush === 'no-soportado'
          ? 'No disponible en este navegador.'
          : 'El navegador pedirá permiso al activarlas.'

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
          <Smartphone size={16} />
          Instalar la app
        </h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Ábrela desde su propio icono, a pantalla completa y sin barra del navegador. También es
          lo que permite recibir avisos con la app cerrada.
        </p>

        {instalada ? (
          <p className="mt-3 rounded-xl bg-[var(--exito-suave)] px-3 py-2 text-sm text-[var(--exito)]">
            Ya está instalada en este dispositivo. Ábrela desde su icono como cualquier otra app.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {puedeInstalar && (
                <Boton onClick={() => void instalar()}>
                  <Download size={16} />
                  Instalar en este dispositivo
                </Boton>
              )}
              <span className="text-xs text-[var(--texto-suave)]">
                {puedeInstalar
                  ? 'El navegador pedirá confirmación.'
                  : 'Si no ves el botón, abre el menú de Chrome (⋮) y elige «Instalar aplicación» o «Añadir a pantalla de inicio».'}
              </span>
            </div>

            {resultado === 'cancelada' && (
              <p className="mt-3 rounded-xl bg-[var(--aviso-suave)] px-3 py-2 text-sm text-[var(--aviso)]">
                Has cancelado la instalación. Puedes volver a intentarlo cuando quieras.
              </p>
            )}
          </>
        )}
      </Tarjeta>

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {estadoPush === 'activas' ? <Bell size={16} /> : <BellOff size={16} />}
          Notificaciones en el móvil
        </h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Recibe avisos aunque la aplicación esté cerrada. Puedes elegir un resumen diario y
          recordatorios para las tareas y exámenes del día siguiente.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Boton
            variante={estadoPush === 'activas' ? 'secundario' : 'primario'}
            onClick={() => void cambiarPush()}
            disabled={
              ocupadoPush ||
              estadoPush === null ||
              estadoPush === 'no-soportado' ||
              estadoPush === 'bloqueadas' ||
              (!claveConfigurada() && estadoPush !== 'activas')
            }
          >
            {estadoPush === 'activas' ? <BellOff size={16} /> : <Bell size={16} />}
            {ocupadoPush
              ? 'Un momento…'
              : estadoPush === 'activas'
                ? 'Desactivar en este dispositivo'
                : 'Activar en este dispositivo'}
          </Boton>

          {estadoPush === 'activas' && (
            <Boton variante="fantasma" onClick={() => void probarPush()} disabled={ocupadoPush}>
              Enviar prueba
            </Boton>
          )}

          <span className="text-xs text-[var(--texto-suave)]">{detallePush}</span>
        </div>

        {estadoPush === 'bloqueadas' && (
          <p className="mt-3 rounded-xl bg-[var(--aviso-suave)] px-3 py-2 text-sm text-[var(--aviso)]">
            Has bloqueado las notificaciones para esta web. Ábrelas desde el candado de la barra
            de direcciones de Chrome y vuelve a intentarlo.
          </p>
        )}

        {estadoPush === 'no-soportado' && (
          <p className="mt-3 rounded-xl bg-[var(--aviso-suave)] px-3 py-2 text-sm text-[var(--aviso)]">
            Este navegador no admite notificaciones push. En Android, usa Chrome actualizado.
          </p>
        )}

        {!claveConfigurada() && (
          <p className="mt-3 rounded-xl bg-[var(--aviso-suave)] px-3 py-2 text-sm text-[var(--aviso)]">
            Falta la clave pública VAPID en la compilación (variable
            <code className="mx-1">VITE_VAPID_PUBLIC_KEY</code>), así que no se puede suscribir
            ningún dispositivo.
          </p>
        )}

        {!sincronizacionActiva && (
          <p className="mt-3 rounded-xl bg-[var(--aviso-suave)] px-3 py-2 text-sm text-[var(--aviso)]">
            Activa la sincronización automática: el servidor necesita tus tareas y hábitos para
            enviarte los avisos programados.
          </p>
        )}

        {avisoPush && (
          <p className="mt-3 rounded-xl bg-[var(--exito-suave)] px-3 py-2 text-sm text-[var(--exito)]">
            {avisoPush}
          </p>
        )}

        {errorPush && (
          <p role="alert" className="mt-3 rounded-xl bg-[var(--peligro-suave)] px-3 py-2 text-sm text-[var(--peligro)]">
            {errorPush}
          </p>
        )}

        <div className="mt-5 grid gap-4 border-t border-[var(--borde)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Resumen diario</p>
              <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                Tareas pendientes, atrasadas y hábitos por marcar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                step={300}
                value={datos.ajustes.horaResumenDiario}
                onChange={(evento) => cambiarAjustes({ horaResumenDiario: evento.target.value })}
                disabled={!datos.ajustes.notificacionesResumenDiario}
                className="rounded-lg border border-[var(--borde)] bg-[var(--fondo)] px-2 py-1.5 text-sm disabled:opacity-50"
                aria-label="Hora del resumen diario"
              />
              <Interruptor
                etiqueta="Resumen diario"
                activo={datos.ajustes.notificacionesResumenDiario}
                onChange={(valor) => cambiarAjustes({ notificacionesResumenDiario: valor })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Aviso para mañana</p>
              <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                Tareas y exámenes del día siguiente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                step={300}
                value={datos.ajustes.horaAvisosProximosEventos}
                onChange={(evento) => cambiarAjustes({ horaAvisosProximosEventos: evento.target.value })}
                disabled={!datos.ajustes.notificacionesProximosEventos}
                className="rounded-lg border border-[var(--borde)] bg-[var(--fondo)] px-2 py-1.5 text-sm disabled:opacity-50"
                aria-label="Hora del aviso de tareas y exámenes"
              />
              <Interruptor
                etiqueta="Aviso de tareas y exámenes para mañana"
                activo={datos.ajustes.notificacionesProximosEventos}
                onChange={(valor) => cambiarAjustes({ notificacionesProximosEventos: valor })}
              />
            </div>
          </div>
          <p className="text-xs text-[var(--texto-suave)]">
            Las horas siguen la zona horaria de este dispositivo. Los ajustes viajan con tus datos
            sincronizados.
          </p>
        </div>
      </Tarjeta>

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database size={16} />
          Datos
        </h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Hay {datos.asignaturas.length} asignaturas, {datos.temas.length} temas
          y {datos.tareas.length} tareas guardadas. Todo se guarda en este
          navegador y, si la sincronización está activa, también en tu cuenta
          privada de Supabase.
        </p>
        <p className="mt-3 rounded-xl bg-[var(--superficie-2)] px-3 py-2 text-xs text-[var(--texto-suave)]">
          La aplicación arranca vacía. Crea tus asignaturas, tareas, exámenes y
          proyectos desde el menú.
        </p>
      </Tarjeta>

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Cloud size={16} />
              Sincronización
            </h2>
            <p className="mt-1 text-sm text-[var(--texto-suave)]">
              Tus datos se guardan en Supabase y aparecen en tus dispositivos
              en unos segundos. Solo tu cuenta puede acceder a ellos.
            </p>
          </div>
          <Interruptor
            etiqueta="Sincronización automática"
            activo={sincronizacionActiva}
            onChange={(valor) => cambiarAjustes({ sincronizacionAutomatica: valor })}
          />
        </div>

        <div className="mt-4 rounded-xl bg-[var(--superficie-2)] px-3 py-2.5 text-sm">
          <p className={`flex items-center gap-2 font-medium ${colorSync}`}>
            {ocupado ? (
              <Loader2 size={16} className="animate-spin" />
            ) : estadoSync === 'error' || estadoSync === 'no_disponible' ? (
              <CloudOff size={16} />
            ) : (
              <Cloud size={16} />
            )}
            {TEXTOS_SYNC[estadoSync]}
          </p>
          {detalleSync && (
            <p className="mt-1 text-xs text-[var(--texto-suave)]">
              {detalleSync}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Boton
            variante="secundario"
            onClick={() => void sincronizarAhora()}
            disabled={ocupado}
          >
            <RefreshCw
              size={16}
              className={ocupado ? 'animate-spin' : undefined}
            />
            Sincronizar ahora
          </Boton>
          <span className="text-xs text-[var(--texto-suave)]">
            {sincronizacionActiva
              ? 'Los cambios se envían solos.'
              : 'Actívala para compartir los datos entre dispositivos.'}
          </span>
        </div>
      </Tarjeta>

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Download size={16} />
          Copia de seguridad
        </h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Exporta todo tu contenido a un archivo JSON o impórtalo en otro
          dispositivo. Sirve como copia de seguridad adicional a la
          sincronización automática. La importación sustituye los datos que
          tengas en este navegador.
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

      <Tarjeta className="mb-4 p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Cuenta</h2>
        <p className="mt-1 text-sm text-[var(--texto-suave)]">
          Sesión iniciada como {correo ?? 'usuario'}.
        </p>
        <Boton variante="secundario" className="mt-3" onClick={() => void salir()}>
          Cerrar sesión
        </Boton>
      </Tarjeta>

      <Tarjeta className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Acerca de</h2>
        <dl className="mt-2 grid gap-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--texto-suave)]">Versión</dt>
            <dd>0.3.0</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--texto-suave)]">Curso</dt>
            <dd>2.º de Bachillerato</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--texto-suave)]">Almacenamiento</dt>
            <dd>
              {sincronizacionActiva
                ? 'Navegador y Supabase'
                : 'Local en este navegador'}
            </dd>
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
