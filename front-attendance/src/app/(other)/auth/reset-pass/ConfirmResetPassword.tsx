import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import AuthShell from '@/components/auth/AuthShell'
import httpClient from '@/helpers/httpClient'

const ConfirmResetPassword = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await httpClient.post('/confirm-password-reset/', { token, new_password: password })
      setDone(true)
    } catch (caught) {
      const data = (caught as AxiosError<{ error?: string }>).response?.data
      setError(data?.error || 'No pudimos actualizar tu contraseña. Solicita un enlace nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Define una contraseña nueva"
      description="Elige una contraseña segura para volver a entrar a tu cuenta."
      footer={<p className="mb-0"><Link to="/auth/login" className="auth-text-link">Volver al inicio de sesión</Link></p>}
    >
      {done ? (
        <Alert variant="success" role="status">
          Contraseña actualizada. Ya puedes <Link to="/auth/login">iniciar sesión</Link>.
        </Alert>
      ) : (
        <Form className="auth-form" onSubmit={handleSubmit}>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <Form.Group className="mb-3" controlId="reset-new-password">
            <Form.Label>Nueva contraseña</Form.Label>
            <Form.Control type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-4" controlId="reset-confirm-password">
            <Form.Label>Confirmar contraseña</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          </Form.Group>
          <div className="d-grid">
            <Button type="submit" variant="primary" className="auth-submit" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </div>
        </Form>
      )}
    </AuthShell>
  )
}

export default ConfirmResetPassword
