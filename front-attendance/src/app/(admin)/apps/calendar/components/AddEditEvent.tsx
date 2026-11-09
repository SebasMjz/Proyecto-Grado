import { Modal, ModalBody, ModalHeader, ModalTitle, Button } from 'react-bootstrap'
import type { CalendarFormType } from '@/types/component-props'

const AddEditEvent = ({ eventData, open, toggle }: CalendarFormType) => {
  // Modal de solo lectura - mostrar información del evento/sesión
  const getEventType = () => {
    if (eventData?.extendedProps?.type === 'event') {
      return 'Evento'
    } else if (eventData?.extendedProps?.type === 'session') {
      return 'Sesión'
    }
    return 'Evento'
  }

  const getEventIcon = () => {
    if (eventData?.extendedProps?.type === 'event') {
      return 'ðŸ“…'
    } else if (eventData?.extendedProps?.type === 'session') {
      return 'â°'
    }
    return 'ðŸ“…'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A'
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Modal show={open} onHide={toggle} className="fade" tabIndex={-1} centered>
      <div className="modal-content">
        <ModalHeader 
          className="modal-header p-3 border-bottom-0" 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
            color: 'white'
          }}
        >
          <ModalTitle className="modal-title" as="h5">
            {getEventIcon()} {getEventType()} - Solo Lectura
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="px-4 pb-4 pt-3">
          <div className="mb-3">
            <h6 className="text-primary mb-2">
              <i className="ri-calendar-event-line me-2"></i>
              Título
            </h6>
            <p className="mb-0 fw-semibold">{eventData?.title || 'N/A'}</p>
          </div>

          {eventData?.extendedProps?.type === 'event' && (
            <>
              <div className="mb-3">
                <h6 className="text-primary mb-2">
                  <i className="ri-file-text-line me-2"></i>
                  Descripción
                </h6>
                <p className="mb-0">{eventData.extendedProps.description || 'Sin descripción'}</p>
              </div>
              
              <div className="mb-3">
                <h6 className="text-primary mb-2">
                  <i className="ri-map-pin-line me-2"></i>
                  Ubicación
                </h6>
                <p className="mb-0">{eventData.extendedProps.location || 'N/A'}</p>
              </div>
              
              <div className="mb-3">
                <h6 className="text-primary mb-2">
                  <i className="ri-checkbox-circle-line me-2"></i>
                  Estado
                </h6>
                <p className="mb-0">
                  <span className={`badge ${
                    eventData.extendedProps.status === 'active' ? 'bg-success' :
                    eventData.extendedProps.status === 'upcoming' ? 'bg-warning' :
                    eventData.extendedProps.status === 'completed' ? 'bg-info' : 'bg-secondary'
                  }`}>
                    {eventData.extendedProps.status || 'N/A'}
                  </span>
                </p>
              </div>
            </>
          )}

          {eventData?.extendedProps?.type === 'session' && (
            <>
              <div className="mb-3">
                <h6 className="text-primary mb-2">
                  <i className="ri-time-line me-2"></i>
                  Horario
                </h6>
                <p className="mb-0">
                  {formatTime(eventData.extendedProps.startTime)} - {formatTime(eventData.extendedProps.endTime)}
                </p>
              </div>
              
              <div className="mb-3">
                <h6 className="text-primary mb-2">
                  <i className="ri-calendar-line me-2"></i>
                  Fecha
                </h6>
                <p className="mb-0">{formatDate(eventData.start as string)}</p>
              </div>
            </>
          )}

          <div className="mb-3">
            <h6 className="text-primary mb-2">
              <i className="ri-calendar-line me-2"></i>
              Fecha de Inicio
            </h6>
            <p className="mb-0">{formatDate(eventData?.start as string)}</p>
          </div>

          {eventData?.end && (
            <div className="mb-3">
              <h6 className="text-primary mb-2">
                <i className="ri-calendar-check-line me-2"></i>
                Fecha de Fin
              </h6>
              <p className="mb-0">{formatDate(eventData.end as string)}</p>
            </div>
          )}

          {eventData?.extendedProps?.isMultiDay && (
            <div className="mb-3">
              <h6 className="text-primary mb-2">
                <i className="ri-calendar-2-line me-2"></i>
                Duración
              </h6>
              <p className="mb-0">
                <span className="badge bg-info">
                  {eventData.extendedProps.duration} día{eventData.extendedProps.duration > 1 ? 's' : ''}
                </span>
              </p>
            </div>
          )}

          <div className="text-center mt-4">
            <Button 
              variant="primary" 
              onClick={toggle}
              style={{
                background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 24px',
                fontWeight: '600'
              }}
            >
              <i className="ri-close-line me-1"></i>
              Cerrar
            </Button>
          </div>
        </ModalBody>
      </div>
    </Modal>
  )
}

export default AddEditEvent