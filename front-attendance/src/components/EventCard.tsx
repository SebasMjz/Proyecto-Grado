import { Card, CardBody, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { EventCard as EventCardType } from '@/types/events'
import { useState } from 'react'
import EditEventModal from '@/components/EditEventModal'
import { formatDateShort } from '@/helpers/dateHelpers'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface EventCardProps {
  event: EventCardType
  onEventUpdated?: () => void
  onEventDeleted?: () => void
  showActions?: boolean
}

const EventCard = ({ event, onEventUpdated, onEventDeleted, showActions = true }: EventCardProps) => {
  const navigate = useNavigate()
  const [showEditModal, setShowEditModal] = useState(false)

  const getStatusBadge = (status: string, originalStatus?: string) => {
    const s = (originalStatus || status || '').toLowerCase()

    if (s === 'publicado' || s === 'active') {
      return (
        <span className="badge-verified px-2 py-1 rounded small d-inline-flex align-items-center gap-1">
          <span className="pulse-beacon" style={{ width: '6px', height: '6px' }}></span>
          Publicado
        </span>
      )
    }
    if (s === 'borrador' || s === 'upcoming') {
      return (
        <span className="badge-sbt px-2 py-1 rounded small d-inline-flex align-items-center gap-1">
          <IconifyIcon icon="solar:clock-circle-bold-duotone" />
          Próximo
        </span>
      )
    }
    if (s === 'completado' || s === 'completed') {
      return (
        <span className="badge-ipfs px-2 py-1 rounded small d-inline-flex align-items-center gap-1">
          <IconifyIcon icon="solar:check-circle-bold-duotone" />
          Completado
        </span>
      )
    }
    return <span className="badge bg-light text-dark border px-2 py-1 rounded small">{originalStatus || status || 'Borrador'}</span>
  }

  const isMultiDayEvent = (startDate?: string, endDate?: string): boolean => {
    if (!startDate || !endDate) return false
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start.toDateString() !== end.toDateString()
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handleCardClick = () => {
    navigate(`/events/${event.id}`)
  }

  const attendanceRatio = event.maxParticipants > 0 
    ? Math.min(Math.round((event.currentParticipants / event.maxParticipants) * 100), 100) 
    : 0

  return (
    <>
      <Card
        className="h-100 event-card position-relative overflow-hidden"
        style={{
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
          transition: 'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease'
        }}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)'
        }}
      >
        {/* Subtle amber accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #b45309 100%)'
          }}
        />

        <CardBody className="p-3 d-flex flex-column justify-content-between">
          <div>
            {/* Header: Title and Status Badge */}
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h5
                className="card-title mb-0 fw-bold"
                title={event.name}
                style={{
                  color: '#0f172a',
                  fontSize: '1.08rem',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {event.name}
              </h5>
              <div className="flex-shrink-0">{getStatusBadge(event.status, event.original_status)}</div>
            </div>

            {/* Description - 100% visible and sharp */}
            <p
              className="small mb-3"
              style={{
                color: '#475569',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.4rem',
                lineHeight: '1.5'
              }}
            >
              {event.description || 'Evento de corta duración con emisión de certificados intransferibles en blockchain.'}
            </p>

            {/* Metadata Grid */}
            <div
              className="p-2.5 rounded-3 mb-3"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.65rem'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <IconifyIcon icon="solar:calendar-bold-duotone" style={{ fontSize: '18px', color: '#d97706' }} />
                <span className="small text-truncate fw-semibold" style={{ color: '#1e293b' }}>
                  {formatDateShort(event.date)}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <IconifyIcon icon="solar:clock-circle-bold-duotone" style={{ fontSize: '18px', color: '#0284c7' }} />
                <span className="small text-truncate fw-semibold" style={{ color: '#1e293b' }}>
                  {event.startTime || '10:00'} - {event.endTime || '18:00'}
                  {isMultiDayEvent(event.start_date, event.end_date) && (
                    <span className="badge bg-info bg-opacity-10 text-info ms-1" style={{ fontSize: '0.65rem' }}>Multi-día</span>
                  )}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <IconifyIcon icon="solar:map-point-bold-duotone" style={{ fontSize: '18px', color: '#dc2626' }} />
                <span className="small text-truncate fw-medium" title={event.location} style={{ color: '#475569' }}>
                  {event.location || 'Presencial'}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <IconifyIcon icon="solar:users-group-rounded-bold-duotone" style={{ fontSize: '18px', color: '#059669' }} />
                <span className="small" style={{ color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>{event.currentParticipants || 0}</strong> / {event.maxParticipants || 50}
                </span>
              </div>
            </div>

            {/* Attendance capacity meter */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center small mb-1" style={{ color: '#64748b' }}>
                <span className="fw-medium">Aforo / Check-in</span>
                <span className="fw-semibold" style={{ color: '#b45309' }}>{attendanceRatio}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${attendanceRatio}%`,
                    height: '100%',
                    background: attendanceRatio > 80 ? 'linear-gradient(90deg, #d97706, #dc2626)' : 'linear-gradient(90deg, #059669, #d97706)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-column gap-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/events/${event.id}`)
                }}
              >
                <IconifyIcon icon="solar:eye-bold-duotone" />
                <span>Ver Sesiones & QR</span>
              </Button>

              {showActions && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleEditClick}
                  title="Editar Evento"
                  className="px-2.5"
                >
                  <IconifyIcon icon="solar:pen-new-square-bold-duotone" />
                </Button>
              )}
            </div>

            {/* Attendance Excel Report */}
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center justify-content-center gap-1.5 rounded-3 w-100"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0369a1',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.45rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0f2fe'
                e.currentTarget.style.borderColor = '#0284c7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  const { downloadAttendanceReportExcel } = await import('@/helpers/attendanceReportHelper')
                  await downloadAttendanceReportExcel(event.id, event.name)
                  toast.success('Reporte de asistencia descargado con éxito')
                } catch (err: any) {
                  console.error('Error descargando reporte:', err)
                  toast.error(err.message || 'Error al descargar reporte')
                }
              }}
            >
              <IconifyIcon icon="solar:document-medicine-bold-duotone" />
              <span>Reporte Excel Asistencia</span>
            </button>
          </div>
        </CardBody>
      </Card>

      {showEditModal && (
        <EditEventModal
          eventId={event.id}
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          onEventUpdated={() => {
            setShowEditModal(false)
            onEventUpdated?.()
          }}
          onEventDeleted={() => {
            setShowEditModal(false)
            onEventDeleted?.()
          }}
        />
      )}
    </>
  )
}

export default EventCard
