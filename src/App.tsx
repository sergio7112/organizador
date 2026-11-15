import { lazy, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { EstructuraApp } from './components/layout/EstructuraApp'
import { useAplicarTema } from './hooks/useAplicarTema'
import { useAppStore } from './store/useAppStore'
import { PaginaHoy } from './pages/PaginaHoy'
import { PaginaAsignaturas } from './pages/PaginaAsignaturas'
import { PaginaAsignaturaDetalle } from './pages/PaginaAsignaturaDetalle'
import { PaginaExamenes } from './pages/PaginaExamenes'
import { PaginaTareas } from './pages/PaginaTareas'
import { PaginaCalendario } from './pages/PaginaCalendario'
import { PaginaProyectos } from './pages/PaginaProyectos'
import { PaginaRepaso } from './pages/PaginaRepaso'
import { PaginaErrores } from './pages/PaginaErrores'
import { PaginaAjustes } from './pages/PaginaAjustes'
import { PaginaNoEncontrada } from './pages/PaginaNoEncontrada'

// El editor Markdown es pesado y solo se usa en el detalle de un proyecto.
const PaginaProyectoDetalle = lazy(() =>
  import('./pages/PaginaProyectoDetalle').then((modulo) => ({
    default: modulo.PaginaProyectoDetalle,
  })),
)

export default function App() {
  useAplicarTema()

  // Guarda el estado inicial vacío aunque el usuario no haya cambiado nada.
  useEffect(() => {
    useAppStore.setState({ datos: useAppStore.getState().datos })
  }, [])

  return (
    <Routes>
      <Route element={<EstructuraApp />}>
        <Route index element={<Navigate to="/hoy" replace />} />
        <Route path="hoy" element={<PaginaHoy />} />
        <Route path="asignaturas" element={<PaginaAsignaturas />} />
        <Route path="asignaturas/:id" element={<PaginaAsignaturaDetalle />} />
        <Route path="examenes" element={<PaginaExamenes />} />
        <Route path="tareas" element={<PaginaTareas />} />
        <Route path="calendario" element={<PaginaCalendario />} />
        <Route path="proyectos" element={<PaginaProyectos />} />
        <Route path="proyectos/:id" element={<PaginaProyectoDetalle />} />
        <Route path="repaso" element={<PaginaRepaso />} />
        <Route path="errores" element={<PaginaErrores />} />
        <Route path="ajustes" element={<PaginaAjustes />} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Route>
    </Routes>
  )
}
