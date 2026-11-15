import { useEffect, useState } from 'react'
import { acceptInvite, login, logout, signup, requestPasswordRecovery, updateUser } from '@netlify/identity'
import { Cloud } from 'lucide-react'
import { useCuentaStore } from '../store/useCuentaStore'
import { useAppStore } from '../store/useAppStore'
import { solicitarOnline } from '../lib/online'
import type { CopiaOnline } from '../lib/online'
import { descargarArchivo, exportarDatos, nombreCopiaSeguridad } from '../lib/sync'
import { Tarjeta } from './ui/Tarjeta'
import { Boton } from './ui/Boton'
import { DialogoConfirmacion } from './ui/DialogoConfirmacion'

export function CuentaOnline() {
  const { usuario, cargando, recuperar, invitacion, mensaje: aviso } = useCuentaStore()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [registro, setRegistro] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(false)
  const [copia, setCopia] = useState<CopiaOnline | null>(null)
  const [confirmar, setConfirmar] = useState<'subir' | 'bajar' | null>(null)

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true); setMensaje(''); setError(false)
    try { await accion() } catch (e) {
      setError(true)
      // Auth errors may contain provider details: keep login feedback concise.
      setMensaje(e instanceof Error ? e.message : 'No se pudo completar la operación. Inténtalo de nuevo.')
    } finally { setOcupado(false); setClave('') }
  }

  useEffect(() => {
    setCopia(null)
    if (!usuario) return
    let activo = true
    setOcupado(true)
    solicitarOnline('GET').then((resultado) => {
      if (activo) setCopia(resultado)
    }).catch((e: unknown) => {
      if (activo) { setError(true); setMensaje(e instanceof Error ? e.message : 'No se pudo consultar la copia online. Tus datos locales se conservan. Pulsa «Consultar estado» para reintentar.') }
    }).finally(() => { if (activo) setOcupado(false) })
    return () => { activo = false }
  }, [usuario?.id])

  const estilo = 'h-11 w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-3 text-sm'
  return <Tarjeta className="mb-4 p-4 sm:p-5">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><Cloud size={16} /> Almacenamiento online</h2>
    <p className="mt-1 text-sm text-[var(--texto-suave)]">Tu copia privada, accesible con tu cuenta desde el ordenador y el móvil. Guarda aquí tus cambios y recupéralos en el otro dispositivo.</p>
    {cargando ? <p role="status" className="mt-4 text-sm">Comprobando sesión…</p> : recuperar || invitacion ? (
      <form className="mt-4 grid max-w-md gap-3" onSubmit={(e) => { e.preventDefault(); void ejecutar(async () => {
        if (invitacion) await acceptInvite(invitacion, clave)
        else await updateUser({ password: clave })
        useCuentaStore.setState({ recuperar: false, invitacion: undefined })
        setMensaje('Contraseña guardada. Ya puedes acceder a tu copia online.')
      }) }}>
        <label className="grid gap-1 text-sm">Nueva contraseña<input className={estilo} type="password" autoComplete="new-password" minLength={8} required value={clave} onChange={(e) => setClave(e.target.value)} /></label>
        <Boton type="submit" disabled={ocupado}>Guardar contraseña</Boton>
      </form>
    ) : usuario ? <div className="mt-4 space-y-3">
      <p className="break-all text-sm font-medium">Sesión iniciada: {usuario.email}</p>
      <p className="text-sm text-[var(--texto-suave)]">{copia ? copia.actualizadoEn ? `Copia online del ${new Date(copia.actualizadoEn).toLocaleString('es-ES')}.` : 'Todavía no tienes una copia online. Guarda tus datos para crearla.' : 'Consulta el estado para acceder a la copia online.'}</p>
      <p className="text-xs text-[var(--texto-suave)]">La sincronización es manual. Los cambios sin conexión permanecen en este navegador hasta que pulses «Guardar online».</p>
      <div className="flex flex-wrap gap-2">
        <Boton disabled={ocupado || !copia} onClick={() => setConfirmar('subir')}>Guardar online</Boton>
        <Boton variante="secundario" disabled={ocupado || !copia?.datos} onClick={() => setConfirmar('bajar')}>Recuperar online</Boton>
        <Boton variante="secundario" disabled={ocupado} onClick={() => { void ejecutar(async () => { setCopia(await solicitarOnline('GET')); setMensaje('Estado online actualizado. Los datos de este navegador no han cambiado.') }) }}>Consultar estado</Boton>
        <Boton variante="fantasma" disabled={ocupado} onClick={() => { void ejecutar(async () => { await logout(); setCopia(null); setMensaje('Sesión cerrada. La copia de este navegador se conserva; exporta tus datos y bórralos si usas un dispositivo compartido.') }) }}>Cerrar sesión</Boton>
      </div>
    </div> : <form className="mt-4 grid max-w-md gap-3" onSubmit={(e) => { e.preventDefault(); void ejecutar(async () => {
      try {
        if (registro) {
          await signup(correo, clave)
          setMensaje('Revisa tu correo y abre el enlace de confirmación para activar tu cuenta.')
        } else { await login(correo, clave); setMensaje('Sesión iniciada. Elige guardar los datos de este navegador o recuperar tu copia online.') }
      } catch { throw new Error(registro ? 'No se pudo crear la cuenta. Comprueba el correo y usa una contraseña de al menos 8 caracteres.' : 'No se pudo iniciar sesión. Comprueba el correo, la contraseña y que hayas confirmado tu cuenta.') }
    }) }}>
      <label className="grid gap-1 text-sm">Correo electrónico<input className={estilo} type="email" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">Contraseña<input className={estilo} type="password" autoComplete={registro ? 'new-password' : 'current-password'} minLength={registro ? 8 : undefined} required value={clave} onChange={(e) => setClave(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2">
        <Boton type="submit" disabled={ocupado}>{registro ? 'Crear mi cuenta' : 'Iniciar sesión'}</Boton>
        <Boton variante="secundario" disabled={ocupado} onClick={() => setRegistro(!registro)}>{registro ? 'Ya tengo cuenta' : 'Crear cuenta'}</Boton>
        <Boton variante="fantasma" disabled={ocupado || !correo} onClick={() => { void ejecutar(async () => { await requestPasswordRecovery(correo); setMensaje('Revisa tu correo para restablecer la contraseña.') }) }}>Olvidé mi contraseña</Boton>
      </div>
    </form>}
    {(ocupado || mensaje || aviso) && <p role={error ? 'alert' : 'status'} className={`mt-3 rounded-xl bg-[var(--superficie-2)] px-3 py-2 text-sm ${error ? 'text-[var(--peligro)]' : 'text-[var(--texto-suave)]'}`}>{ocupado ? 'Conectando…' : mensaje || aviso}</p>}
    <DialogoConfirmacion abierto={confirmar !== null} titulo={confirmar === 'subir' ? 'Guardar datos online' : 'Recuperar datos online'} textoConfirmar={confirmar === 'subir' ? 'Guardar online' : 'Recuperar'} peligro={false}
      mensaje={confirmar === 'subir' ? 'Los datos actuales de este navegador sustituirán tu copia online. Guarda primero los cambios de otros dispositivos que quieras conservar.' : 'La copia online sustituirá los datos de este navegador. Antes se descargará una copia de seguridad de los datos actuales.'}
      onCerrar={() => setConfirmar(null)} onConfirmar={() => { const accion = confirmar; void ejecutar(async () => {
        if (!copia) return
        if (accion === 'subir') {
          const resultado = await solicitarOnline('PUT', { datos: useAppStore.getState().datos, revision: copia.revision })
          setCopia({ ...resultado, datos: useAppStore.getState().datos })
          setMensaje('Datos guardados online. Puedes recuperarlos en otro dispositivo con tu cuenta.')
        } else {
          const reciente = await solicitarOnline('GET')
          if (!reciente.datos) throw new Error('No hay una copia online para recuperar.')
          descargarArchivo(nombreCopiaSeguridad(), exportarDatos(useAppStore.getState().datos))
          useAppStore.getState().reemplazarDatos(reciente.datos)
          setCopia(reciente); setMensaje('Datos recuperados correctamente. Se descargó una copia de seguridad de los datos anteriores.')
        }
      }) }} />
  </Tarjeta>
}
