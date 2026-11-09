import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import AuthShell from '@/components/auth/AuthShell'
import httpClient from '@/helpers/httpClient'

const ResetPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await httpClient.post('/request-password-reset/', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (caught) {
      const data = (caught as AxiosError<{ error?: string }>).response?.data
      setError(data?.error || 'No pudimos enviar el correo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Recupera tu contraseña"
      description="Te enviaremos un enlace para definir una contraseña nueva."
      footer={<p className="mb-0"><Link to="/auth/login" className="auth-text-link">Volver al inicio de sesión</Link></p>}
    >
      {sent ? (
        <Alert variant="success" role="status">Revisa tu correo. El enlace de recuperación estará disponible durante una hora.</Alert>
      ) : (
        <Form className="auth-form" onSubmit={handleSubmit}>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <Form.Group controlId="reset-email">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@ejemplo.com"
              required
            />
          </Form.Group>
          <div className="d-grid mt-4">
            <Button variant="primary" className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </div>
        </Form>
      )}
    </AuthShell>
  )
}

export default ResetPassword
