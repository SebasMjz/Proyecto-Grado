import PageTitle from '@/components/PageTItle'
import { Col, Row, Card, CardBody, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import EventCard from '@/components/EventCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const EventsList = () => {
  const { events, loading, error, refreshEvents } = useEvents()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="py-2">
        <PageTitle title={'Lista de Eventos & Sesiones'} />
        <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '50vh' }}>
          <div className="spinner-border" role="status" style={{ width: '2.5rem', height: '2.5rem', color: '#d97706' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 fw-medium" style={{ color: '#64748b' }}>Cargando eventos académicos y tecnológicos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-2">
        <PageTitle title={'Lista de Eventos & Sesiones'} />
        <Card className="text-center py-5" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <CardBody>
            <IconifyIcon icon="solar:danger-triangle-bold-duotone" className="text-danger mb-3" style={{ fontSize: '3.5rem' }} />
            <h4 className="fw-bold mb-2 text-dark">Error al conectar con los eventos</h4>
            <p className="mb-4" style={{ maxWidth: '450px', margin: '0 auto', color: '#64748b' }}>{error}</p>
            <Button variant="primary" onClick={refreshEvents} className="d-inline-flex align-items-center gap-1">
              <IconifyIcon icon="solar:refresh-bold-duotone" />
              <span>Reintentar Conexión</span>
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-2">
      <PageTitle title={'Lista de Eventos & Sesiones'} />

      {/* Header bar */}
      <div
        className="p-4 mb-4 rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.06)'
        }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="pulse-beacon"></span>
            <span className="badge-sbt px-2 py-0.5 rounded small">Módulo de Asistencia</span>
          </div>
          <h3 className="fw-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Eventos Académicos & Tecnológicos ({events.length})
          </h3>
          <p className="small mb-0" style={{ color: '#475569' }}>
            Control de asistencia por sesiones QR y acreditación con Soulbound Tokens.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={refreshEvents}
            className="d-flex align-items-center gap-1"
          >
            <IconifyIcon icon="solar:refresh-bold-duotone" />
            <span>Actualizar</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/events/event-add')}
            className="d-flex align-items-center gap-1"
          >
            <IconifyIcon icon="solar:add-circle-bold-duotone" />
            <span>Nuevo Evento</span>
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="text-center py-5" style={{ background: '#ffffff', border: '1px dashed #cbd5e1' }}>
          <CardBody>
            <IconifyIcon icon="solar:calendar-broken" style={{ fontSize: '3.5rem', color: '#94a3b8' }} className="mb-3" />
            <h5 className="fw-bold mb-2" style={{ color: '#0f172a' }}>No hay eventos registrados</h5>
            <p className="mb-4" style={{ color: '#64748b' }}>Crea tu primer evento para iniciar el control de sesiones.</p>
            <Button variant="primary" onClick={() => navigate('/events/event-add')}>
              <IconifyIcon icon="solar:add-circle-bold-duotone" className="me-1" />
              Crear Evento
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Row className="g-3">
          {events.map((event) => (
            <Col lg={6} md={12} key={event.id}>
              <EventCard
                event={event}
                onEventUpdated={refreshEvents}
                onEventDeleted={refreshEvents}
                showActions={true}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default EventsList
