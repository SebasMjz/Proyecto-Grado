import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import httpClient from '@/helpers/httpClient'

type SignUpFields = {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
}

const initialFields: SignUpFields = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const SignUpForm = () => {
  const navigate = useNavigate()
  const [fields, setFields] = useState(initialFields)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (name: keyof SignUpFields, value: string) => {
    setFields((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (fields.password !== fields.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const email = fields.email.trim().toLowerCase()
      await httpClient.post('/sign-up/', {
        first_name: fields.first_name.trim(),
        last_name: fields.last_name.trim(),
        email,
        password: fields.password,
      })
      navigate(`/auth/activate-account?email=${encodeURIComponent(email)}&registered=1`)
    } catch (caught) {
      const response = (caught as AxiosError<Record<string, string | string[]>>).response?.data
      const firstError = response && Object.values(response)[0]
      setError(
        typeof firstError === 'string'
          ? firstError
          : Array.isArray(firstError)
            ? firstError[0]
            : 'No pudimos crear la cuenta. Inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form className="auth-form" onSubmit={handleSubmit}>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <div className="row g-3">
        <Form.Group className="col-sm-6" controlId="sign-up-first-name">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            value={fields.first_name}
            onChange={(event) => setField('first_name', event.target.value)}
            autoComplete="given-name"
            placeholder="Tu nombre"
            maxLength={100}
            required
          />
        </Form.Group>
        <Form.Group className="col-sm-6" controlId="sign-up-last-name">
          <Form.Label>Apellido</Form.Label>
          <Form.Control
            value={fields.last_name}
            onChange={(event) => setField('last_name', event.target.value)}
            autoComplete="family-name"
            placeholder="Tu apellido"
            maxLength={100}
            required
          />
        </Form.Group>
      </div>
      <Form.Group className="mt-3" controlId="sign-up-email">
        <Form.Label>Correo electrónico</Form.Label>
        <Form.Control
          type="email"
          value={fields.email}
          onChange={(event) => setField('email', event.target.value)}
          autoComplete="email"
          placeholder="nombre@ejemplo.com"
          required
        />
        <Form.Text>Usa el mismo correo al que se emiten tus certificados.</Form.Text>
      </Form.Group>
      <Form.Group className="mt-3" controlId="sign-up-password">
        <Form.Label>Contraseña</Form.Label>
        <div className="auth-password-field">
          <Form.Control
            type={showPassword ? 'text' : 'password'}
            value={fields.password}
            onChange={(event) => setField('password', event.target.value)}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
          >
            {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        </div>
      </Form.Group>
      <Form.Group className="mt-3" controlId="sign-up-confirm-password">
        <Form.Label>Confirmar contraseña</Form.Label>
        <Form.Control
          type={showPassword ? 'text' : 'password'}
          value={fields.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          required
        />
      </Form.Group>
      <div className="d-grid mt-4">
        <Button variant="primary" type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </div>
      <p className="auth-hint mt-3 mb-0">Te enviaremos un código para verificar tu correo.</p>
    </Form>
  )
}

export default SignUpForm
