import ComponentContainerCard from '@/components/ComponentContainerCard'
import { Col, Row } from 'react-bootstrap'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { Button } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import { CreateEventData } from '@/types/events'

const EventAdd = () => {
  const { createEvent } = useEvents()
  const navigate = useNavigate()

  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: '',
    requirements: '',
    isMultiDay: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setEventData(prev => ({ ...prev, [field]: value }))

    // Si se cambia isMultiDay, ajustar endDate
    if (field === 'isMultiDay') {
      if (!value) {
        setEventData(prev => ({ ...prev, endDate: prev.startDate }))
      }
    }

    // Si se cambia startDate y no es multi-día, actualizar endDate
    if (field === 'startDate' && !eventData.isMultiDay && typeof value === 'string') {
      setEventData(prev => ({ ...prev, endDate: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventData.name || !eventData.startDate || !eventData.location || !eventData.description) {
      return
    }

    setIsSubmitting(true)

    try {
      // Convertir datos del formulario al formato del backend
      const createEventData: CreateEventData = {
        title: eventData.name,
        description: eventData.description,
        location: eventData.location,
        capacity: parseInt(eventData.maxParticipants) || undefined,
        start_date: eventData.startDate,
        end_date: eventData.isMultiDay ? eventData.endDate : eventData.startDate,
        status: 'Borrador',
      }

      const success = await createEvent(createEventData)

      if (success) {
        // Redirigir a la lista de eventos
        navigate('/events/events-list')
      }
    } catch (error) {
      console.error('Error al crear evento:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Row>
        <Col xs={12}>
          <ComponentContainerCard
            id="crear-evento"
            title="CREAR NUEVO EVENTO"
            description="Completa la información del evento"
          >
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Información del Evento</h5>
              </CardHeader>
              <CardBody>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Nombre del Evento *</Form.Label>
                        <Form.Control
                          type="text"
                          value={eventData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Ingresa el nombre del evento"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Ubicación *</Form.Label>
                        <Form.Control
                          type="text"
                          value={eventData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Ingresa la ubicación del evento"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="isMultiDay"
                          label="Evento de múltiples días"
                          checked={eventData.isMultiDay}
                          onChange={(e) => handleInputChange('isMultiDay', e.target.checked)}
                          className="fw-semibold"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={eventData.isMultiDay ? 6 : 4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          {eventData.isMultiDay ? 'Fecha de Inicio *' : 'Fecha *'}
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={eventData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    {eventData.isMultiDay && (
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Fecha de Fin *</Form.Label>
                          <Form.Control
                            type="date"
                            value={eventData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                            min={eventData.startDate}
                            required
                          />
                        </Form.Group>
                      </Col>
                    )}

                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Máximo de Participantes</Form.Label>
                        <Form.Control
                          type="number"
                          value={eventData.maxParticipants}
                          onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                          placeholder="Número máximo de participantes"
                          min="1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Requisitos</Form.Label>
                        <Form.Control
                          type="text"
                          value={eventData.requirements}
                          onChange={(e) => handleInputChange('requirements', e.target.value)}
                          placeholder="Requisitos para participar"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Descripción del Evento *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={eventData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe el evento, sus objetivos y contenido"
                      required
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={!eventData.name || !eventData.startDate || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-1" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <i className="ri-calendar-event-line me-1"></i>
                          Crear Evento
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => navigate('/events/events-list')}
                      disabled={isSubmitting}
                    >
                      <i className="ri-close-line me-1"></i>
                      Cancelar
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  )
}

export default EventAdd
