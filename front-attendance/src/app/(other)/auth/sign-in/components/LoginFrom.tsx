import TextFormInput from '@/components/form/TextFormInput'

import { Alert, Button } from 'react-bootstrap'
import useSignIn from './useSignIn'
import PasswordFormInput from '@/components/form/PasswordFormInput'
import { Link } from 'react-router-dom'

const LoginFrom = () => {
  const { loading, login, control, error } = useSignIn()
  return (
    <form className="authentication-form auth-form" onSubmit={login}>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <TextFormInput control={control} name="email" containerClassName="mb-3" label="Correo electrónico" id="email-id" type="email" autoComplete="email" placeholder="nombre@ejemplo.com" />

      <PasswordFormInput
        control={control}
        name="password"
        containerClassName="mb-3"
        placeholder="Ingresa tu contraseña"
        id="password-id"
        autoComplete="current-password"
        label={
          <>
            <Link to="/auth/reset-pass" className="float-end auth-text-link ms-1">
              Recuperar contraseña
            </Link>
            <label className="form-label" htmlFor="password-id">
              Contraseña
            </label>
          </>
        }
      />
      <div className="mt-4 text-center d-grid">
        <Button variant="primary" type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </div>
    </form>
  )
}

export default LoginFrom
