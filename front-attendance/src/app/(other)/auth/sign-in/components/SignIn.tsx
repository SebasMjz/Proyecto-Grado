import { Link } from 'react-router-dom'
import AuthShell from '@/components/auth/AuthShell'
import LoginFrom from './LoginFrom'

const SignIn = () => (
  <AuthShell
    title="Bienvenido de nuevo"
    description="Inicia sesión para gestionar eventos, asistencias y certificados desde un solo lugar."
    footer={
      <>
        <p className="mb-2">¿Aún no tienes cuenta?</p>
        <Link to="/auth/sign-up" className="auth-create-link">Crear cuenta</Link>
        <p className="auth-footer-secondary mb-0">
          ¿Ya recibiste un código? <Link to="/auth/activate-account">Activar cuenta</Link>
        </p>
      </>
    }
  >
    <LoginFrom />
  </AuthShell>
)

export default SignIn
