const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

let ventana = null

function abrirEnNavegador(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    void shell.openExternal(url)
  }
}

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 360,
    minHeight: 600,
    title: 'Organizador',
    icon: path.join(__dirname, '..', 'icono.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  })

  // HashRouter: el índice se abre con #/hoy y la navegación interna cambia solo
  // el fragmento, así que no hace falta ningún servidor local.
  const indice = path.join(__dirname, '..', 'dist', 'index.html')
  void ventana.loadFile(indice, { hash: '/hoy' })

  ventana.once('ready-to-show', () => ventana.show())

  ventana.webContents.setWindowOpenHandler(({ url }) => {
    abrirEnNavegador(url)
    return { action: 'deny' }
  })

  ventana.webContents.on('will-navigate', (evento, url) => {
    if (!url.startsWith('file://')) {
      evento.preventDefault()
      abrirEnNavegador(url)
    }
  })

  ventana.on('closed', () => {
    ventana = null
  })
}

const tieneBloqueo = app.requestSingleInstanceLock()

if (!tieneBloqueo) {
  app.quit()
} else {
  app.whenReady().then(crearVentana)

  app.on('second-instance', () => {
    if (!ventana) {
      crearVentana()
      return
    }
    if (ventana.isMinimized()) ventana.restore()
    ventana.focus()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
}
