import { Modal, ModalBody, ModalHeader, ModalTitle, Button, Form, Row, Col, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { Event } from '@/types/events'
import httpClient from '@/helpers/httpClient'

interface EditEventModalProps {
    eventId: string
    show: boolean
    onHide: () => void
    onEventUpdated: () => void
    onEventDeleted: () => void
}

const EditEventModal = ({ eventId, show, onHide, onEventUpdated, onEventDeleted }: EditEventModalProps) => {
    const { updateEvent, deleteEvent } = useEvents()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        capacity: 0,
        status: 'Borrador' as 'Borrador' | 'Publicado' | 'Cancelado' | 'Completado',
        registration_deadline: '',
        start_date: '',
        end_date: '',
        requires_attendance_for_certificate: false,
        minimum_attendance_percentage: 75
    })

    useEffect(() => {
        if (show && eventId) {
            loadEventData()
        }
    }, [show, eventId])

    const loadEventData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await httpClient.getEvent(eventId)
            const event: Event = response.data

            setFormData({
                title: event.title,
                description: event.description,
                location: event.location,
                capacity: event.capacity || 0,
                status: event.status,
                // Extraer solo la fecha (YYYY-MM-DD) del datetime (YYYY-MM-DDTHH:MM:SS)
                registration_deadline: event.registration_deadline
                    ? event.registration_deadline.split('T')[0]
                    : '',
                start_date: event.start_date,
                end_date: event.end_date,
                requires_attendance_for_certificate: event.requires_attendance_for_certificate,
                minimum_attendance_percentage: event.minimum_attendance_percentage
            })
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al cargar el evento')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            setFormData(prev => ({ ...prev, [name]: checked }))
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
        } else if (type === 'date') {
            // Con Django configurado para Bolivia, simplemente usamos el valor directo
            setFormData(prev => ({ ...prev, [name]: value }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setSaving(true)
            setError(null)

            // Preparar datos - agregar hora a registration_deadline si existe
            const submitData = {
                ...formData,
                id: eventId,
                // Django espera DateTimeField para registration_deadline
                // Convertir YYYY-MM-DD a YYYY-MM-DDTHH:MM:SS
                registration_deadline: formData.registration_deadline
                    ? `${formData.registration_deadline}T23:59:59`
                    : undefined
            }

            const success = await updateEvent(submitData)

            if (success) {
                onEventUpdated()
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al actualizar el evento')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            setError(null)

            const success = await deleteEvent(eventId)

            if (success) {
                onEventDeleted()
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al eliminar el evento')
        } finally {
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            backdrop="static"
        >
            <div style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(255, 255, 255, 1) 100%)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                <ModalHeader
                    closeButton
                    style={{
                        background: 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)',
                        color: 'white',
                        borderBottom: 'none',
                        padding: '1.5rem 2rem'
                    }}
                >
                    <ModalTitle style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        <i className="ri-edit-line me-3" style={{ fontSize: '1.8rem' }}></i>
                        Editar Evento
                    </ModalTitle>
                </ModalHeader>
                <ModalBody style={{ padding: '2rem' }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '0.3rem' }}>
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-4 text-muted fw-semibold">Cargando datos del evento...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <Alert
                                    variant="danger"
                                    dismissible
                                    onClose={() => setError(null)}
                                    style={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                        color: 'white'
                                    }}
                                >
                                    <i className="ri-error-warning-line me-2"></i>
                                    {error}
                                </Alert>
                            )}

                            {showDeleteConfirm ? (
                                <Alert
                                    variant="danger"
                                    style={{
                                        borderRadius: '12px',
                                        border: '2px solid #dc3545',
                                        background: 'rgba(220, 53, 69, 0.1)'
                                    }}
                                >
                                    <h5 className="alert-heading" style={{ color: '#dc3545' }}>
                                        <i className="ri-alert-line me-2"></i>
                                        ¿Estás seguro?
                                    </h5>
                                    <p style={{ color: '#721c24' }}>Esta acción eliminará permanentemente el evento y todas sus sesiones asociadas. Esta acción no se puede deshacer.</p>
                                    <hr style={{ borderColor: '#dc3545' }} />
                                    <div className="d-flex gap-2 justify-content-end">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={deleting}
                                            style={{ borderRadius: '8px', fontWeight: '600' }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            style={{ borderRadius: '8px', fontWeight: '600' }}
                                        >
                                            {deleting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Eliminando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-delete-bin-line me-2"></i>
                                                    Sí, eliminar evento
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Alert>
                            ) : (
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={12} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-text me-2"></i>
                                                    Título del Evento *
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Ej: Conferencia de Investigación 2024"
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-file-text-line me-2"></i>
                                                    Descripción *
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Describe el evento..."
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-map-pin-line me-2"></i>
                                                    Ubicación *
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Ej: Auditorio Principal"
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-user-line me-2"></i>
                                                    Capacidad Máxima
                                                </Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="capacity"
                                                    value={formData.capacity}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    placeholder="Ej: 100"
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-calendar-line me-2"></i>
                                                    Fecha de Inicio *
                                                </Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="start_date"
                                                    value={formData.start_date}
                                                    onChange={handleInputChange}
                                                    required
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-calendar-check-line me-2"></i>
                                                    Fecha de Fin *
                                                </Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="end_date"
                                                    value={formData.end_date}
                                                    onChange={handleInputChange}
                                                    required
                                                    min={formData.start_date}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-checkbox-circle-line me-2"></i>
                                                    Estado *
                                                </Form.Label>
                                                <Form.Select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    required
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                >
                                                    <option value="Borrador">Borrador</option>
                                                    <option value="Publicado">Publicado</option>
                                                    <option value="Completado">Completado</option>
                                                    <option value="Cancelado">Cancelado</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6} className="mb-4">
                                            <Form.Group>
                                                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                    <i className="ri-time-line me-2"></i>
                                                    Fecha Límite de Registro
                                                </Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="registration_deadline"
                                                    value={formData.registration_deadline}
                                                    onChange={handleInputChange}
                                                    max={formData.start_date}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #e0e0e0',
                                                        padding: '0.75rem 1rem',
                                                        fontSize: '1rem'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Check
                                                    type="checkbox"
                                                    name="requires_attendance_for_certificate"
                                                    checked={formData.requires_attendance_for_certificate}
                                                    onChange={handleInputChange}
                                                    label={
                                                        <span style={{ color: '#0a192f', fontWeight: '600' }}>
                                                            <i className="ri-award-line me-2"></i>
                                                            Requiere asistencia para certificado
                                                        </span>
                                                    }
                                                    style={{ fontSize: '1rem' }}
                                                />
                                            </Form.Group>
                                        </Col>

                                        {formData.requires_attendance_for_certificate && (
                                            <Col md={12} className="mb-4">
                                                <Form.Group>
                                                    <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                                                        <i className="ri-percent-line me-2"></i>
                                                        Porcentaje Mínimo de Asistencia: <span style={{ color: '#ffc107', fontSize: '1.1rem' }}>{formData.minimum_attendance_percentage}%</span>
                                                    </Form.Label>
                                                    <Form.Range
                                                        name="minimum_attendance_percentage"
                                                        value={formData.minimum_attendance_percentage}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        style={{
                                                            height: '8px',
                                                            background: `linear-gradient(to right, #ffc107 0%, #ffc107 ${formData.minimum_attendance_percentage}%, #e0e0e0 ${formData.minimum_attendance_percentage}%, #e0e0e0 100%)`
                                                        }}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        )}
                                    </Row>

                                    <hr style={{ margin: '2rem 0', borderColor: '#e0e0e0' }} />

                                    <div className="d-flex gap-3 justify-content-between align-items-center">
                                        <Button
                                            variant="danger"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            disabled={saving || deleting}
                                            style={{
                                                borderRadius: '10px',
                                                padding: '0.75rem 1.5rem',
                                                fontWeight: '600',
                                                fontSize: '1rem',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
                                            }}
                                        >
                                            <i className="ri-delete-bin-line me-2"></i>
                                            Eliminar Evento
                                        </Button>

                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="light"
                                                onClick={onHide}
                                                disabled={saving || deleting}
                                                style={{
                                                    borderRadius: '10px',
                                                    padding: '0.75rem 1.5rem',
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    border: '2px solid #e0e0e0'
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={saving || deleting}
                                                style={{
                                                    background: 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    padding: '0.75rem 2rem',
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                                }}
                                            >
                                                {saving ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-save-line me-2"></i>
                                                        Guardar Cambios
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </>
                    )}
                </ModalBody>
            </div>
        </Modal>
    )
}

export default EditEventModal
