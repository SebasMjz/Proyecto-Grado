import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, CardBody, Form, Table } from 'react-bootstrap'
import PageTitle from '@/components/PageTItle'
import httpClient from '@/helpers/httpClient'

type Event = { id: string; title: string; start_date: string; attendance_closed_at: string | null }
type Candidate = { registration_id: string; participant_name: string; participant_email: string; attended_sessions: number; total_sessions: number }
type Certificate = {
  id: string
  blockchain_status: 'legacy' | 'pending_wallet' | 'pending_chain' | 'confirmed' | 'failed'
  transaction_hash: string
  chain_id: number | null
  snapshot: { participant_name?: string }
  registration: { participant: { first_name: string; last_name: string; email: string } }
}
type Page<T> = { results: T[]; count: number }

const CertificatesPage = () => {
  // shortcut: cada lista carga hasta 1000 registros; paginar cuando se alcance ese volumen.
  const [events, setEvents] = useState<Event[]>([])
  const [eventId, setEventId] = useState('')
  const [closed, setClosed] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [issued, setIssued] = useState<Certificate[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    httpClient.get<Page<Event>>('/events/?page_size=1000')
      .then(({ data }) => {
        setEvents(data.results)
        setEventId(data.results[0]?.id || '')
      })
      .catch(() => setError('No se pudieron cargar los eventos.'))
      .finally(() => setLoading(false))
  }, [])

  const refresh = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError('')
    try {
      const [eligible, certificates] = await Promise.all([
        httpClient.get<{ attendance_closed_at: string | null; results: Candidate[] }>(`/certificates/eligible/?event=${eventId}`),
        httpClient.get<Page<Certificate>>(`/certificates/?registration__event=${eventId}&page_size=1000`),
      ])
      setCandidates(eligible.data.results)
      setClosed(!!eligible.data.attendance_closed_at)
      setIssued(certificates.data.results)
    } catch {
      setError('No se pudieron cargar las acreditaciones. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { void refresh() }, [refresh])

  const closeAttendance = async () => {
    if (!window.confirm('Cerrar la asistencia impedirá corregir sesiones y registros de este evento. ¿Continuar?')) return
    setBusy(true)
    setError('')
    try {
      await httpClient.post(`/events/${eventId}/close-attendance/`)
      await refresh()
    } catch {
      setError('No se pudo cerrar la asistencia. Comprueba que el evento tenga sesiones activas.')
    } finally {
      setBusy(false)
    }
  }

  const issue = async (registrationId: string) => {
    setBusy(true)
    setError('')
    try {
      await httpClient.post('/certificates/issue/', { registration_id: registrationId })
      await refresh()
    } catch {
      setError('No se pudo emitir el certificado. Revisa la asistencia y vuelve a cargar la lista.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="py-2">
      <PageTitle title="Certificados" />
      <Card className="mb-4">
        <CardBody>
          <h2 className="h5">Emisión por evento</h2>
          <p className="text-muted">Solo puedes emitir a participantes confirmados que asistieron a más del 50 % de las sesiones activas.</p>
          <Form.Group controlId="certificate-event" className="mb-3">
            <Form.Label>Evento</Form.Label>
            <Form.Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.length === 0 && <option value="">Sin eventos</option>}
              {events.map((event) => <option key={event.id} value={event.id}>{event.title} · {event.start_date}</option>)}
            </Form.Select>
          </Form.Group>
          {eventId && <p>{closed ? 'Asistencia cerrada. Puedes emitir certificados.' : 'Asistencia abierta. Ciérrala después de revisar las correcciones.'}</p>}
          {eventId && !closed && <Button disabled={busy || loading} onClick={closeAttendance}>Cerrar asistencia del evento</Button>}
        </CardBody>
      </Card>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      {loading ? <p role="status">Cargando certificados…</p> : eventId && <>
        <Card className="mb-4"><CardBody>
          <h2 className="h5">Participantes elegibles ({candidates.length})</h2>
          {candidates.length === 0 ? <p className="mb-0 text-muted">Nadie cumple el requisito o todos los certificados ya fueron emitidos.</p> :
            <div className="table-responsive"><Table hover className="align-middle"><thead><tr><th>Participante</th><th>Asistencia</th><th>Acción</th></tr></thead><tbody>
              {candidates.map((candidate) => <tr key={candidate.registration_id}>
                <td>{candidate.participant_name}<small className="d-block text-muted">{candidate.participant_email}</small></td>
                <td>{candidate.attended_sessions} de {candidate.total_sessions} sesiones</td>
                <td><Button size="sm" disabled={!closed || busy} onClick={() => issue(candidate.registration_id)}>Emitir certificado</Button></td>
              </tr>)}
            </tbody></Table></div>}
        </CardBody></Card>
        <Card><CardBody>
          <h2 className="h5">Certificados emitidos ({issued.length})</h2>
          {issued.length === 0 ? <p className="mb-0 text-muted">Aún no hay certificados emitidos para este evento.</p> :
            <div className="table-responsive"><Table hover className="align-middle"><thead><tr><th>Titular</th><th>Blockchain</th><th>Transacción</th></tr></thead><tbody>
              {issued.map((certificate) => <tr key={certificate.id}>
                <td>{certificate.snapshot.participant_name || `${certificate.registration.participant.first_name} ${certificate.registration.participant.last_name}`}</td>
                <td>{{ legacy: 'Emisión anterior · sin respaldo blockchain', pending_wallet: 'Esperando billetera del titular', pending_chain: 'Pendiente de confirmación', confirmed: 'Confirmado · SBT intransferible', failed: 'Transacción fallida' }[certificate.blockchain_status]}</td>
                <td>{certificate.transaction_hash && certificate.chain_id === 11155111 ?
                  <a href={`https://sepolia.etherscan.io/tx/${certificate.transaction_hash}`} target="_blank" rel="noopener noreferrer">Ver en Sepolia</a> :
                  certificate.transaction_hash || 'Sin transacción'}</td>
              </tr>)}
            </tbody></Table></div>}
        </CardBody></Card>
      </>}
    </div>
  )
}

export default CertificatesPage
