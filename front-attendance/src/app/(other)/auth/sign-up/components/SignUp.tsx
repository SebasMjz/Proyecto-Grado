import { Link } from 'react-router-dom'
import AuthShell from '@/components/auth/AuthShell'
import SignUpForm from './SignUpForm'

const SignUp = () => (
  <AuthShell
    title="Crea tu cuenta"
    description="Regístrate con tu correo para consultar los certificados emitidos a tu nombre."
    footer={
      <p className="mb-0">
        ¿Ya tienes cuenta? <Link to="/auth/login" className="auth-text-link">Iniciar sesión</Link>
      </p>
    }
  >
    <SignUpForm />
  </AuthShell>
)

export default SignUp
