import { Navigate, Route, Routes, type RouteProps, useLocation } from 'react-router-dom'
import { appRoutes, authRoutes, memberRoutes } from '@/routes/index'
import { useAuthContext } from '@/context/useAuthContext'
import OtherLayout from '@/layout/OtherLayout'
import AdminLayout from '@/layout/AdminLayout'

const AppRouter = (props: RouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuthContext()
  const location = useLocation()
  const isMember = user?.user_type === 'member'
  const signedInHome = isMember ? '/my-certificates' : '/dashboard'

  // Si está cargando la verificación de sesión
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#060b17' }}>
        <div className="text-center">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted fw-medium">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Ruta raíz: si está autenticado va a dashboard, sino directo al login */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? signedInHome : '/auth/login'} replace />}
      />

      {/* Rutas de autenticación (si ya está autenticado, redirige al dashboard) */}
      {(authRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated && (route.path === '/auth/login' || route.path === '/auth/sign-in' || route.path === '/auth/sign-up') ? (
              <Navigate to={signedInHome} replace />
            ) : (
              <OtherLayout {...props}>{route.element}</OtherLayout>
            )
          }
        />
      ))}

      {/* Rutas protegidas de la aplicación (requieren sesión activa) */}
      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated && !isMember ? (
              <AdminLayout {...props}>{route.element}</AdminLayout>
            ) : isAuthenticated ? (
              <Navigate to={signedInHome} replace />
            ) : (
              <Navigate
                to={`/auth/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`}
                replace
              />
            )
          }
        />
      ))}

      {memberRoutes.map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={isAuthenticated && isMember ? (
            <OtherLayout {...props}>{route.element}</OtherLayout>
          ) : (
            <Navigate to={isAuthenticated ? signedInHome : '/auth/login'} replace />
          )}
        />
      ))}

      {/* Catch-all Wildcard Route: evita pantallas negras */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? signedInHome : '/auth/login'} replace />}
      />
    </Routes>
  )
}

export default AppRouter
