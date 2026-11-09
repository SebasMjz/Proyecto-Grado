import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import AuthShell from '@/components/auth/AuthShell'
import httpClient from '@/helpers/httpClient'

const ActivateAccountPage = () => {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    activation_code: '',
    new_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [activated, setActivated] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    setError('')
    setResent(false)
    setResending(true)
    try {
      await httpClient.post('/resend-activation/', { email: form.email.trim().toLowerCase() })
      setResent(true)
    } catch (caught) {
      const data = (caught as AxiosError<{ error?: string }>).response?.data
      setError(data?.error || 'No pudimos reenviar el código.')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await httpClient.post('/activate-account/', {
        email: form.email.trim().toLowerCase(),
        activation_code: form.activation_code.trim(),
        ...(form.new_password ? { new_password: form.new_password } : {}),
      })
      setActivated(true)
    } catch (caught) {
      const data = (caught as AxiosError<Record<string, string | string[]>>).response?.data
      const firstError = data && Object.values(data)[0]
      setError(
        typeof firstError === 'string'
          ? firstError
          : Array.isArray(firstError)
            ? firstError[0]
            : 'No pudimos activar tu cuenta. Revisa el código e inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Activa tu cuenta"
      description="Verifica tu correo para acceder a tus certificados."
      footer={<p className="mb-0"><Link to="/auth/login" className="auth-text-link">Volver al inicio de sesión</Link></p>}
    >
      {searchParams.get('registered') === '1' && !activated && (
        <Alert variant="success">Cuenta creada. Revisa tu correo e ingresa el código que te enviamos.</Alert>
      )}
      {activated ? (
        <Alert variant="success" role="status">
          Tu cuenta está activa. Ya puedes <Link to="/auth/login">iniciar sesión</Link>.
        </Alert>
      ) : (
        <Form className="auth-form" onSubmit={handleSubmit}>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          {resent && <Alert variant="success" role="status">Te enviamos un código nuevo.</Alert>}
          <Form.Group className="mb-3" controlId="activation-email">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="activation-code">
            <Form.Label>Código de activación</Form.Label>
            <Form.Control
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={form.activation_code}
              onChange={(event) => setForm({ ...form, activation_code: event.target.value })}
              placeholder="6 dígitos"
              required
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="activation-password">
            <Form.Label>Contraseña nueva (solo si recibiste una invitación)</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={form.new_password}
              onChange={(event) => setForm({ ...form, new_password: event.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
            <Form.Text>Si acabas de registrarte, conserva la contraseña que elegiste.</Form.Text>
          </Form.Group>
          <button type="button" className="auth-inline-action mb-3" onClick={handleResend} disabled={resending || !form.email.trim()}>
            {resending ? 'Reenviando…' : 'Reenviar código de activación'}
          </button>
          <div className="d-grid">
            <Button type="submit" variant="primary" className="auth-submit" disabled={loading}>
              {loading ? 'Activando…' : 'Activar cuenta'}
            </Button>
          </div>
        </Form>
      )}
    </AuthShell>
  )
}

export default ActivateAccountPage
