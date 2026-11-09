import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Alert, Spinner } from 'react-bootstrap'
import ComponentContainerCard from '@/components/ComponentContainerCard'
import AttendanceManagement from '@/components/attendance/AttendanceManagement'
import { useEvents } from '@/hooks/useEvents'
import { useEventSessions } from '@/hooks/useEventSessions'
import { Event } from '@/types/events'

const SessionAttendancePage: React.FC = () => {
  const { eventId, sessionId } = useParams()
  const navigate = useNavigate()
  const { getEvent } = useEvents()
  const { sessions, loading: sessionsLoading } = useEventSessions(eventId)

  const [event, setEvent] = useState<Event | null>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!eventId || !sessionId) {
        setError('ID de evento o sesión no válido')
        setEventLoading(false)
        return
      }

      try {
        setEventLoading(true)
        setError(null)

        // Cargar evento
        const eventData = await getEvent(eventId)
        if (!eventData) {
          setError('Evento no encontrado')
          return
        }
        setEvent(eventData)

      } catch (err) {
        setError('Error al cargar los datos')
      } finally {
        setEventLoading(false)
      }
    }

    loadData()
  }, [eventId, sessionId]) // Removemos getEvent de las dependencias

  // Buscar la sesión específica
  const session = sessions.find(s => s.id === sessionId)

  // Estamos cargando si cualquiera de los dos esta
  const isLoading = eventLoading || sessionsLoading

  if (isLoading) {
    return (
      <Row>
        <Col xs={12}>
          <ComponentContainerCard
            id="loading"
            title="Cargando..."
            description="Obteniendo información de la sesión"
          >
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando datos de la sesión...</p>
            </div>
          </ComponentContainerCard>
        </Col>
      </Row>
    )
  }

  if (error || !event || !session) {
    return (
      <Row>
        <Col xs={12}>
          <ComponentContainerCard
            id="error"
            title="Error"
            description="No se pudo cargar la información"
          >
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error || 'Sesión no encontrada'}</p>
              <hr />
              <div className="d-flex justify-content-end">
                <button
                  className="btn btn-outline-danger"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  Volver al Evento
                </button>
              </div>
            </Alert>
          </ComponentContainerCard>
        </Col>
      </Row>
    )
  }

  return (
    <div className="session-attendance-page">
      {/*Header de la sesion*/}
      <Row className="mb-4">
        <Col xs={12}>
          <ComponentContainerCard
            id="session-header"
            title="Gestión de Asistencia"
            description={`Evento: ${event.title}`}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1">{session.session_name || 'Sesión Principal'}</h4>
                <p className="text-muted mb-0">
                  <i className="ri-calendar-line me-2"></i>
                  {new Date(session.session_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-muted mb-0">
                  <i className="ri-time-line me-2"></i>
                  {session.start_time} - {session.end_time}
                </p>
              </div>
              <div className="text-end">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  <i className="ri-arrow-left-line me-2"></i>
                  Volver al Evento
                </button>
              </div>
            </div>
          </ComponentContainerCard>
        </Col>
      </Row>

      {/* Componentes de gestion de asistencia*/}
      <AttendanceManagement
        sessionId={sessionId!}
        eventId={eventId!}
        sessionName={session.session_name || 'Sesión Principal'}
        sessionDate={session.session_date}
        startTime={session.start_time}
        endTime={session.end_time}
      />
    </div>
  )
}

export default SessionAttendancePage
