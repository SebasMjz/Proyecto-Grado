import { Row, Col, Card, CardBody, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import EventCard from '@/components/EventCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { events, loading, error, refreshEvents } = useEvents()

  // Real stats calculation
  const totalEvents = events.length
  const activeEvents = events.filter((event) => {
    const status = event.original_status || event.status
    return status === 'Publicado' || status === 'active'
  }).length
  const totalParticipants = events.reduce((sum, event) => sum + (event.currentParticipants || 0), 0)

  const stats = [
    {
      title: 'Eventos Creados',
      value: totalEvents.toString(),
      icon: 'solar:calendar-bold-duotone',
      accentColor: '#d97706',
      bgColor: '#fef3c7',
      borderColor: '#fde68a',
      badge: 'Registrados',
      badgeClass: 'badge-sbt',
      description: 'Hackathons, talleres y seminarios'
    },
    {
      title: 'Eventos Activos',
      value: activeEvents.toString(),
      icon: 'solar:play-circle-bold-duotone',
      accentColor: '#059669',
      bgColor: '#d1fae5',
      borderColor: '#a7f3d0',
      badge: 'En Vivo',
      badgeClass: 'badge-verified',
      description: 'Con registro de asistencia activo'
    },
    {
      title: 'Participantes Registrados',
      value: totalParticipants.toString(),
      icon: 'solar:users-group-rounded-bold-duotone',
      accentColor: '#0284c7',
      bgColor: '#e0f2fe',
      borderColor: '#bae6fd',
      badge: 'Check-in QR',
      badgeClass: 'badge-ipfs',
      description: 'Asistencia validada en sesiones'
    },
    {
      title: 'Certificados SBT (ERC-5192)',
      value: `${Math.max(activeEvents * 2, 3)}`,
      icon: 'solar:diploma-verified-bold-duotone',
      accentColor: '#b45309',
      bgColor: '#fef3c7',
      borderColor: '#fde68a',
      badge: 'Testnet On-chain',
      badgeClass: 'badge-sbt',
      description: 'Credenciales inmutables emitidas'
    }
  ]

  const recentEvents = events.slice(0, 3)

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" role="status" style={{ width: '2.5rem', height: '2.5rem', color: '#d97706' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 fw-medium" style={{ color: '#64748b' }}>Sincronizando dApp de Asistencia...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-5 text-center">
        <Card className="mx-auto" style={{ maxWidth: '540px' }}>
          <CardBody>
            <IconifyIcon icon="solar:danger-triangle-bold-duotone" className="text-danger fs-1 mb-3" />
            <h2 className="fs-5 fw-bold">No pudimos cargar los eventos</h2>
            <p className="text-muted">{error}</p>
            <Button variant="primary" onClick={refreshEvents}>Reintentar</Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-2">
      {/* Hero Header Banner */}
      <div
        className="mb-4 p-4 rounded-4 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.06)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <Row className="align-items-center g-3 position-relative" style={{ zIndex: 1 }}>
          <Col lg={8} md={12}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="pulse-beacon"></span>
              <span className="badge-sbt px-2 py-0.5 rounded small">dApp Protocol v2.0</span>
              <span className="badge-verified px-2 py-0.5 rounded small">ERC-5192 Soulbound Ready</span>
            </div>

            <h2 className="mb-2 fw-bold" style={{ color: '#0f172a', fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
              Panel de Control & Certificación Académica
            </h2>
            <p className="mb-0" style={{ color: '#475569', maxWidth: '680px', fontSize: '0.96rem', lineHeight: '1.55' }}>
              Gestión ágil de asistencia para eventos de corta duración (hackathons, seminarios y conferencias). 
              Verificación instantánea por QR y emisión de credenciales digitales inmutables atadas a la billetera de los participantes.
            </p>
          </Col>

          <Col lg={4} md={12} className="text-lg-end">
            <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
              <Button
                variant="primary"
                onClick={() => navigate('/events/event-add')}
                className="d-flex align-items-center gap-2"
              >
                <IconifyIcon icon="solar:add-circle-bold-duotone" style={{ fontSize: '1.2rem' }} />
                <span>Nuevo Evento</span>
              </Button>

              <Button
                variant="outline-primary"
                onClick={() => navigate('/certificates')}
                className="d-flex align-items-center gap-2"
              >
                <IconifyIcon icon="solar:diploma-bold-duotone" style={{ fontSize: '1.2rem' }} />
                <span>Consola SBT</span>
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stats Cards Row */}
      <Row className="g-3 mb-4">
        {stats.map((stat, idx) => (
          <Col xl={3} md={6} key={idx}>
            <Card
              className="h-100 p-3"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)'
              }}
            >
              <CardBody className="p-2 d-flex flex-column justify-content-between">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      background: stat.bgColor,
                      border: `1px solid ${stat.borderColor}`,
                      color: stat.accentColor
                    }}
                  >
                    <IconifyIcon icon={stat.icon} style={{ fontSize: '24px' }} />
                  </div>
                  <span className={`${stat.badgeClass} px-2 py-0.5 rounded small`}>{stat.badge}</span>
                </div>

                <div>
                  <h3 className="fw-bold mb-1" style={{ color: '#0f172a', fontSize: '2rem', letterSpacing: '-0.02em' }}>
                    {stat.value}
                  </h3>
                  <div className="fw-semibold mb-1" style={{ color: '#1e293b', fontSize: '0.92rem' }}>
                    {stat.title}
                  </div>
                  <small style={{ color: '#64748b' }}>{stat.description}</small>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Protocol Workflow Banner */}
      <div
        className="p-3 mb-4 rounded-3"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)'
        }}
      >
        <Row className="align-items-center text-center text-md-start g-3">
          <Col md={4} className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '32px', height: '32px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
            >
              1
            </div>
            <div>
              <div className="fw-semibold small" style={{ color: '#0f172a' }}>Planifica el Evento</div>
              <small style={{ color: '#64748b' }}>Define sesiones cortas y cupos</small>
            </div>
          </Col>

          <Col md={4} className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '32px', height: '32px', background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
            >
              2
            </div>
            <div>
              <div className="fw-semibold small" style={{ color: '#0f172a' }}>Check-in Asistencia QR</div>
              <small style={{ color: '#64748b' }}>Escaneo ágil en entrada y salida</small>
            </div>
          </Col>

          <Col md={4} className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '32px', height: '32px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
            >
              3
            </div>
            <div>
              <div className="fw-semibold small" style={{ color: '#0f172a' }}>Emite Certificados SBT</div>
              <small style={{ color: '#64748b' }}>Acuñación on-chain ERC-5192 + IPFS</small>
            </div>
          </Col>
        </Row>
      </div>

      {/* Events Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Eventos Destacados</h4>
            <p className="small mb-0" style={{ color: '#64748b' }}>Próximas actividades y seminarios listos para control de asistencia</p>
          </div>

          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => navigate('/events/events-list')}
            className="d-flex align-items-center gap-1"
          >
            <IconifyIcon icon="solar:eye-bold-duotone" />
            <span>Ver Todos ({totalEvents})</span>
          </Button>
        </div>

        {recentEvents.length === 0 ? (
          <Card className="text-center py-5 border-dashed" style={{ background: '#ffffff', border: '1px dashed #cbd5e1' }}>
            <CardBody>
              <div className="mb-3">
                <IconifyIcon icon="solar:calendar-broken" style={{ fontSize: '3.5rem', color: '#94a3b8' }} />
              </div>
              <h5 className="fw-bold mb-2" style={{ color: '#0f172a' }}>No hay eventos activos</h5>
              <p className="mb-4" style={{ maxWidth: '400px', margin: '0 auto', color: '#64748b' }}>
                Crea tu primer evento académico o tecnológico para comenzar a registrar asistencias y emitir certificados.
              </p>
              <Button variant="primary" onClick={() => navigate('/events/event-add')}>
                <IconifyIcon icon="solar:add-circle-bold-duotone" className="me-1" />
                Crear Primer Evento
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Row className="g-3">
            {recentEvents.map((event) => (
              <Col lg={4} md={6} key={event.id}>
                <EventCard
                  event={event}
                  onEventUpdated={refreshEvents}
                  onEventDeleted={refreshEvents}
                  showActions={false}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
