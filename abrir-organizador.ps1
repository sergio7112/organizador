param(
  [switch]$SinNavegador,
  [switch]$Detener,
  [switch]$Movil
)

# Abre el Organizador en el navegador. Si el servidor local no está en marcha,
# lo inicia en segundo plano sirviendo la versión de producción (dist/).
# Este script lo usa el acceso directo del escritorio.

$ErrorActionPreference = 'SilentlyContinue'
$proyecto = Split-Path -Parent $MyInvocation.MyCommand.Path
$puerto = 4173
$url = "http://127.0.0.1:$puerto/hoy"
$hostServidor = if ($Movil) { '0.0.0.0' } else { '127.0.0.1' }

function Mostrar-Error([string]$mensaje) {
  $shell = New-Object -ComObject WScript.Shell
  $shell.Popup($mensaje, 0, 'Organizador', 16) | Out-Null
  exit 1
}

function Puerto-Abierto {
  $cliente = New-Object System.Net.Sockets.TcpClient
  try {
    $cliente.Connect('127.0.0.1', $puerto)
    return $true
  } catch {
    return $false
  } finally {
    $cliente.Close()
  }
}

function Escucha-En-Red {
  $escuchas = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue
  return [bool]($escuchas | Where-Object {
    $_.LocalAddress -eq '0.0.0.0' -or $_.LocalAddress -eq '::'
  })
}

function Obtener-IPv4 {
  $ruta = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
    Sort-Object RouteMetric | Select-Object -First 1
  if (-not $ruta) { return $null }
  $direccion = Get-NetIPAddress -InterfaceIndex $ruta.InterfaceIndex `
    -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1
  return $direccion.IPAddress
}

function Necesita-Compilar {
  $indice = Join-Path $proyecto 'dist\index.html'
  if (-not (Test-Path $indice)) { return $true }

  $fechaDist = (Get-Item $indice).LastWriteTime
  $rutas = @('src', 'public')
  $archivos = @(
    (Join-Path $proyecto 'index.html'),
    (Join-Path $proyecto 'vite.config.ts'),
    (Join-Path $proyecto 'package.json')
  )

  foreach ($ruta in $rutas) {
    $carpeta = Join-Path $proyecto $ruta
    if (Test-Path $carpeta) {
      $archivos += Get-ChildItem $carpeta -Recurse -File | Select-Object -ExpandProperty FullName
    }
  }

  foreach ($archivo in $archivos) {
    if ((Get-Item $archivo).LastWriteTime -gt $fechaDist) { return $true }
  }
  return $false
}

if ($Detener) {
  $procesos = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($proceso in $procesos) {
    Stop-Process -Id $proceso -Force -ErrorAction SilentlyContinue
  }
  exit 0
}

$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
  [System.Environment]::GetEnvironmentVariable('PATH', 'User')

$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) {
  $npm = Join-Path ${env:ProgramFiles} 'nodejs\npm.cmd'
}
if (-not (Test-Path $npm)) {
  Mostrar-Error 'No se ha encontrado Node.js. Instálalo para poder abrir el Organizador.'
}

# Si hay cambios en el código se regenera la versión de producción, aunque el
# servidor ya esté en marcha.
if (Necesita-Compilar) {
  $compilacion = Start-Process -FilePath $npm -ArgumentList @('run', 'build') `
    -WorkingDirectory $proyecto -WindowStyle Hidden -PassThru -Wait
  if ($compilacion.ExitCode -ne 0) {
    Mostrar-Error 'No se pudo preparar la aplicación. Revisa que el proyecto compile correctamente.'
  }
}

# En modo móvil el servidor debe escuchar en toda la red local. Si ya había uno
# arrancado solo para este equipo, se reinicia con el host correcto.
if ($Movil -and (Puerto-Abierto) -and -not (Escucha-En-Red)) {
  Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
}

if (-not (Puerto-Abierto)) {
  Start-Process -FilePath $npm `
    -ArgumentList @('run', 'preview', '--', '--host', $hostServidor, '--port', "$puerto") `
    -WorkingDirectory $proyecto -WindowStyle Hidden

  $listo = $false
  for ($intento = 0; $intento -lt 60; $intento++) {
    Start-Sleep -Milliseconds 500
    if (Puerto-Abierto) {
      $listo = $true
      break
    }
  }

  if (-not $listo) {
    Mostrar-Error 'El servidor local del Organizador no ha arrancado. Inténtalo de nuevo en unos segundos.'
  }
}

if ($Movil) {
  $ip = Obtener-IPv4
  if (-not $ip) {
    Mostrar-Error 'No se ha podido detectar la dirección de la red local. Comprueba que este equipo está conectado a una red Wi-Fi o por cable.'
  }

  $urlMovil = "http://${ip}:$puerto/hoy"
  Set-Clipboard -Value $urlMovil -ErrorAction SilentlyContinue

  $shell = New-Object -ComObject WScript.Shell
  $shell.Popup(
    "Conecta el móvil a la misma red Wi-Fi que este equipo y abre:`n`n$urlMovil`n`nLa dirección ya está copiada al portapapeles.",
    30,
    'Organizador en el móvil',
    64
  ) | Out-Null
  exit 0
}

if (-not $SinNavegador) {
  Start-Process $url
}

