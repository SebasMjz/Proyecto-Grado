import ComponentContainerCard from '@/components/ComponentContainerCard'
import { Col, Row } from 'react-bootstrap'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { Button } from 'react-bootstrap'
import { Badge } from 'react-bootstrap'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import { useEventSessions } from '@/hooks/useEventSessions'
import { useEventRegistrations } from '@/hooks/useEventRegistrations'
import { Event } from '@/types/events'
import httpClient from '@/helpers/httpClient'
import { formatDateToSpanish, formatDateShort } from '@/helpers/dateHelpers'
import { downloadAttendanceReportExcel } from '@/helpers/attendanceReportHelper'
// Usar iconos de Remix Icons que ya están disponibles
import { Form, Modal } from 'react-bootstrap'
import TimeInput from '@/components/TimeInput'

const EventDetail = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { getEvent } = useEvents()
  const { sessions, loading: sessionsLoading, createSession, updateSession } = useEventSessions(eventId)
  const { registrations, loading: registrationsLoading, fetchRegistrations } = useEventRegistrations(eventId)

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showDefaultSessionModal, setShowDefaultSessionModal] = useState(false)
  const [showEditSessionModal, setShowEditSessionModal] = useState(false)
  const [editingSession, setEditingSession] = useState<any>(null)
  const { updateEvent } = useEvents()
  // Estado para alta/búsqueda de participantes
  const [participantForm, setParticipantForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    identification_number: '',
    type: 'Estudiante',
    career: ''
  })
  const [participantSearch, setParticipantSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null)
  const [sessionForm, setSessionForm] = useState({
    session_name: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00'
  })
  const [excelFile, setExcelFile] = useState<File | null>(null)
  // Estado para búsqueda y paginación de participantes
  const [participantSearchInTable, setParticipantSearchInTable] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Nuevos modales para participantes
  const [showEditParticipantModal, setShowEditParticipantModal] = useState(false)
  const [showResendQRModal, setShowResendQRModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<any>(null)
  const [modalMessage, setModalMessage] = useState({ title: '', message: '' })
  const [modalKind, setModalKind] = useState<'success' | 'warning' | 'error'>('success')
  const [editParticipantEmail, setEditParticipantEmail] = useState('')

  // Filtrar registrations basado en la búsqueda
  const filteredRegistrations = useMemo(() => {
    const searchLower = participantSearchInTable.toLowerCase().trim()
    return registrations.filter((registration) => {
      if (!searchLower) return true
      const fullName = `${registration.participant.first_name} ${registration.participant.last_name}`.toLowerCase()
      const email = registration.participant.email?.toLowerCase() || ''
      const phone = registration.participant.phone?.toLowerCase() || ''
      const qrCode = registration.registration_code?.toLowerCase() || ''
      const career = registration.participant.career?.toLowerCase() || ''

      return fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        qrCode.includes(searchLower) ||
        career.includes(searchLower)
    })
  }, [registrations, participantSearchInTable])

  // Calcular paginación
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const visibleRegistrations = filteredRegistrations.slice(startIndex, endIndex)

  // Resetear a página 1 cuando se busca
  useEffect(() => {
    setCurrentPage(1)
  }, [participantSearchInTable])

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0])
    }
  }

  const handleExcelUpload = async () => {
    if (!event?.id || !excelFile) return
    try {
      const form = new FormData()
      form.append('file', excelFile)
      const resp = await httpClient.post(`/participants/bulk_upload/?event=${event.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Reemplazar alert nativo por modal
      // Filtrar solo errores reales (no filas vacías)
      const realErrors = resp.data.skipped_rows?.filter((row: any) =>
        row.reason && !row.reason.includes('Campos básicos vacíos')
      ) || []

      let message = `OK Nuevos participantes: ${resp.data.created_participants}\nOK Registrados al evento: ${resp.data.created_registrations}`

      if (realErrors.length > 0) {
        message += `\n\nATENCION: NO SE PUDIERON REGISTRAR: ${realErrors.length}\n`
        message += `\n------------------------------\n`
        message += `DETALLES DE ERRORES:\n`
        message += `------------------------------\n\n`

        // Mostrar TODOS los errores (importante para control de 300+ registros)
        realErrors.forEach((err: any, index: number) => {
          message += `${index + 1}. Fila ${err.row}: ${err.reason}\n`
        })

        message += `\n------------------------------`
        message += `\n\nRevisa el Excel y corrige estos errores para volver a importar.`
      }

      setModalMessage({
        title: realErrors.length > 0 ? 'Importacion completada con errores' : 'Importacion completada',
        message: message
      })
      setModalKind(realErrors.length > 0 ? 'warning' : 'success')
      setShowSuccessModal(true)
      setExcelFile(null)
      await fetchRegistrations(event.id)
    } catch (err: any) {
      console.error('Error importando excel', err?.response?.data || err)
      // Reemplazar alert nativo por modal
      setModalMessage({
        title: 'Error',
        message: err?.response?.data?.detail || 'Error al importar el Excel'
      })
      setModalKind('error')
      setShowSuccessModal(true)
    }
  }

  // Funciones para editar participante y reenviar QR
  const handleEditParticipant = (registration: any) => {
    setEditingParticipant(registration)
    setEditParticipantEmail(registration.participant.email)
    setShowEditParticipantModal(true)
  }

  const handleSaveParticipantEmail = async () => {
    if (!editingParticipant) return

    try {
      await httpClient.patch(`/participants/${editingParticipant.participant.id}/`, {
        email: editParticipantEmail
      })

      setModalMessage({
        title: 'Email actualizado',
        message: `El email se actualizó correctamente a: ${editParticipantEmail}`
      })
      setModalKind('success')
      setShowEditParticipantModal(false)
      setShowSuccessModal(true)
      if (event?.id) await fetchRegistrations(event.id)
    } catch (err: any) {
      setModalMessage({
        title: 'Error',
        message: err.response?.data?.detail || 'Error al actualizar el email'
      })
      setModalKind('error')
      setShowEditParticipantModal(false)
      setShowSuccessModal(true)
    }
  }

  const handleResendQR = (registration: any) => {
    setEditingParticipant(registration)
    setShowResendQRModal(true)
  }

  const confirmResendQR = async () => {
    if (!editingParticipant) return

    try {
      await httpClient.post(`/registrations/${editingParticipant.id}/send_qr_email/`)

      setModalMessage({
        title: 'QR reenviado',
        message: `El código QR fue enviado a: ${editingParticipant.participant.email}`
      })
      setModalKind('success')
      setShowResendQRModal(false)
      setShowSuccessModal(true)
    } catch (err: any) {
      setModalMessage({
        title: 'Error',
        message: err.response?.data?.detail || 'Error al reenviar el QR'
      })
      setModalKind('error')
      setShowResendQRModal(false)
      setShowSuccessModal(true)
    }
  }
  const [defaultSessionForm, setDefaultSessionForm] = useState({
    session_name: 'Sesión Principal',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00'
  })
  const [editSessionForm, setEditSessionForm] = useState({
    session_name: '',
    session_date: '',
    start_time: '',
    end_time: ''
  })
  const [allAttendances, setAllAttendances] = useState<any[]>([])
  // const [hasAttemptedDefaultSession, setHasAttemptedDefaultSession] = useState(false)

  // Crear sesión por defecto - función estable con useCallback
  const createDefaultSession = useCallback(async (eventId: string) => {
    try {
      await createSession({
        event_id: eventId,
        session_date: defaultSessionForm.session_date,
        start_time: defaultSessionForm.start_time + ':00',
        end_time: defaultSessionForm.end_time + ':00',
        session_name: defaultSessionForm.session_name
      })
      setShowDefaultSessionModal(false)
    } catch (err) {
      console.error('Error al crear sesión por defecto:', err)
    }
  }, [createSession, defaultSessionForm])

  // Cargar asistencias de todas las sesiones
  const loadAllAttendances = useCallback(async () => {
    if (!eventId || sessions.length === 0) return

    try {
      console.log('Cargando asistencias del evento con endpoint optimizado')

      // Usar el nuevo endpoint optimizado que devuelve todas las asistencias de una vez
      const response = await httpClient.get(`/attendances/by_event/${eventId}/`)
      const attendances = response.data.attendances || []

      // Mapear las asistencias con la información de sesión
      const flatAttendances = attendances.map((attendance: any) => ({
        ...attendance,
        sessionId: attendance.session.id,
        sessionName: attendance.session.session_name
      }))

      console.log('Asistencias cargadas en una sola peticion:', flatAttendances.length)
      setAllAttendances(flatAttendances)
    } catch (err) {
      console.error('Error cargando asistencias:', err)
    }
  }, [eventId, sessions])

  // Cargar evento al montar el componente
  useEffect(() => {
    const loadEvent = async () => {
      console.log('EventDetail - eventId from params:', eventId)

      if (!eventId || eventId === ':eventId' || eventId.includes(':')) {
        console.error('EventDetail - Invalid eventId:', eventId)
        setError('ID de evento no válido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        // setHasAttemptedDefaultSession(false) // Reset para nuevo evento

        console.log('EventDetail - Calling getEvent with:', eventId)
        const eventData = await getEvent(eventId)
        if (eventData) {
          setEvent(eventData)
        } else {
          setError('Evento no encontrado')
        }
      } catch (err) {
        setError('Error al cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId, getEvent])

  // Cargar participantes y asistencias cuando cambien las sesiones
  useEffect(() => {
    if (eventId && sessions.length > 0) {
      fetchRegistrations(eventId)
      loadAllAttendances()
    }
  }, [eventId, sessions.length, fetchRegistrations, loadAllAttendances])

  // TEMPORALMENTE DESACTIVADO - Crear sesión por defecto cuando se cargan las sesiones (solo una vez por evento)
  // useEffect(() => {
  //   console.log('ðŸ”„ useEffect sesión por defecto:', {
  //     event: !!event,
  //     sessionsLength: sessions.length,
  //     sessionsLoading,
  //     loading,
  //     hasAttemptedDefaultSession
  //   })

  //   if (event && sessions.length === 0 && !sessionsLoading && !loading && !hasAttemptedDefaultSession) {
  //     console.log('ðŸŽ¯ Condiciones cumplidas, creando sesión por defecto')
  //     setHasAttemptedDefaultSession(true)
  //     createDefaultSession(event.id)
  //   }
  // }, [event?.id, sessions.length, sessionsLoading, loading, hasAttemptedDefaultSession, createDefaultSession])

  const getStatusBadge = (status: string) => {
    // Mapear estados del backend a los badges del frontend
    switch (status) {
      case 'Publicado':
        return <Badge bg="success">Publicado</Badge>
      case 'Borrador':
        return <Badge bg="warning">Borrador</Badge>
      case 'Completado':
        return <Badge bg="secondary">Completado</Badge>
      case 'Cancelado':
        return <Badge bg="danger">Cancelado</Badge>
      // Compatibilidad con valores antiguos
      case 'active':
        return <Badge bg="success">Activo</Badge>
      case 'upcoming':
        return <Badge bg="warning">Próximo</Badge>
      case 'completed':
        return <Badge bg="secondary">Completado</Badge>
      case 'cancelled':
        return <Badge bg="danger">Cancelado</Badge>
      default:
        return <Badge bg="info">{status || 'Sin estado'}</Badge>
    }
  }

  const getParticipantTypeBadge = (type: string) => {
    // Normalizar el tipo para asegurar consistencia
    const normalizedType = type?.toLowerCase() || ''

    if (normalizedType.includes('estudiante') || normalizedType === 'student') {
      return <Badge bg="info">Estudiante</Badge>
    }
    if (normalizedType.includes('profesional') || normalizedType === 'professional') {
      return <Badge bg="primary">Profesional</Badge>
    }

    // Si no coincide con ningún tipo conocido, mostrar Estudiante por defecto
    return <Badge bg="info">Estudiante</Badge>
  }

  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <Badge bg="success">Confirmado</Badge>
      case 'Pendiente':
        return <Badge bg="warning">Pendiente</Badge>
      case 'Cancelado':
        return <Badge bg="danger">Cancelado</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }


  // Función para renderizar círculos de asistencia
  const renderAttendanceCircles = (participantId: string) => {
    const totalSessions = sessions.length
    const participantAttendances = allAttendances.filter(att => att.registration.participant.id === participantId)

    // Crear array de círculos
    const circles = []
    for (let i = 0; i < totalSessions; i++) {
      const session = sessions[i]
      const hasAttended = participantAttendances.some(att =>
        att.sessionId === session?.id
      )

      circles.push(
        <div
          key={i}
          className={`rounded-circle d-inline-flex align-items-center justify-content-center me-1`}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: hasAttended ? '#28a745' : '#dee2e6',
            color: hasAttended ? 'white' : '#6c757d',
            fontSize: '10px',
            fontWeight: 'bold',
            border: hasAttended ? '2px solid #28a745' : '2px solid #dee2e6',
            transition: 'all 0.3s ease'
          }}
          title={hasAttended ? `Asistió a sesión ${i + 1}` : `No asistió a sesión ${i + 1}`}
        >
          {hasAttended ? 'OK' : ''}
        </div>
      )
    }

    return (
      <div className="d-flex align-items-center">
        {circles}
        <span className="ms-2 small text-muted">
          {participantAttendances.length}/{totalSessions}
        </span>
      </div>
    )
  }

  // Buscar participantes existentes (por nombre o correo)
  const searchParticipants = useCallback(async (query: string) => {
    try {
      if (!query || query.trim().length < 2) {
        setSearchResults([])
        return
      }
      const resp = await httpClient.get(`/participants/?search=${encodeURIComponent(query)}`)
      const results = resp.data.results || resp.data
      setSearchResults(results)
    } catch (err) {
      console.error('Error buscando participantes', err)
    }
  }, [])

  const handleSelectExistingParticipant = (participant: any) => {
    setSelectedParticipant(participant)
    setParticipantSearch(`${participant.first_name} ${participant.last_name} - ${participant.email}`)
    setSearchResults([])
  }

  const resetParticipantForm = () => {
    setSelectedParticipant(null)
    setParticipantForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      identification_number: '',
      type: 'Estudiante',
      career: ''
    })
    setParticipantSearch('')
  }

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event?.id) return

    try {
      let participantId: string | null = null

      if (selectedParticipant) {
        participantId = selectedParticipant.id
      } else {
        // Intentar crear participante nuevo (si existe por email/ID, usarlo)
        try {
          const createResp = await httpClient.post('/participants/', participantForm)
          participantId = createResp.data.id
        } catch (err: any) {
          // Si ya existe por email/identification_number, buscar y usar
          const q = participantForm.email || participantForm.identification_number
          if (q) {
            const findResp = await httpClient.get(`/participants/?search=${encodeURIComponent(q)}`)
            const found = (findResp.data.results || findResp.data)[0]
            if (found) participantId = found.id
          }
          if (!participantId) throw err
        }
      }

      if (!participantId) return

      // Registrar al evento evitando duplicados (backend ya tiene unicidad)
      try {
        await httpClient.post('/registrations/', { participant_id: participantId, event_id: event.id, status: 'Confirmado' })
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0]
        if (!msg || !String(msg).toLowerCase().includes('unique')) throw err
        // Ya estaba registrado; continuar
      }

      await fetchRegistrations(event.id)
      alert('Participante asociado al evento')
      setShowParticipantModal(false)
      resetParticipantForm()
    } catch (err) {
      console.error('Error registrando participante', err)
      alert('No se pudo registrar el participante')
    }
  }

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!event?.id) return

    // Validar si ya existe una sesión con la misma fecha y hora
    const existingSession = sessions.find(session =>
      session.session_date === sessionForm.session_date &&
      session.start_time === sessionForm.start_time + ':00'
    )

    if (existingSession) {
      setModalMessage({
        title: 'Sesion duplicada',
        message: `Ya existe una sesión con la misma fecha (${sessionForm.session_date}) y hora de inicio (${sessionForm.start_time}). Por favor, cambia la fecha o la hora.`
      })
      setModalKind('warning')
      setShowSuccessModal(true)
      return
    }

    const sessionData = {
      event_id: event.id,
      session_name: sessionForm.session_name,
      session_date: sessionForm.session_date,
      start_time: sessionForm.start_time.includes(':') ? sessionForm.start_time + ':00' : sessionForm.start_time,
      end_time: sessionForm.end_time.includes(':') ? sessionForm.end_time + ':00' : sessionForm.end_time
    }

    createSession(sessionData)
    setShowSessionModal(false)
    setSessionForm({
      session_name: '',
      session_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00'
    })
  }

  const handleDefaultSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!event?.id) return

    createDefaultSession(event.id)
  }

  const handleEditSession = (session: any) => {
    setEditingSession(session)
    setEditSessionForm({
      session_name: session.session_name || '',
      session_date: session.session_date,
      start_time: session.start_time.substring(0, 5), // Remover los segundos
      end_time: session.end_time.substring(0, 5)
    })
    setShowEditSessionModal(true)
  }

  const handleEditSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSession || !event?.id) return

    // Normalizar la fecha para evitar problemas de zona horaria
    // Django está configurado para Bolivia (UTC-4), así que enviamos la fecha tal cual
    const sessionData = {
      event_id: event.id,
      session_name: editSessionForm.session_name,
      session_date: editSessionForm.session_date, // Ya está en formato YYYY-MM-DD
      start_time: editSessionForm.start_time, // TimeInput ya devuelve HH:MM
      end_time: editSessionForm.end_time // TimeInput ya devuelve HH:MM
    }

    const success = await updateSession(editingSession.id, sessionData)
    if (success) {
      setShowEditSessionModal(false)
      setEditingSession(null)
    }
  }

  // Exportar Excel con QR embebido como imagen
  const exportQrExcel = async () => {
    try {
      const ExcelNS = await import('exceljs')
      const QRCodeNS = await import('qrcode')
      const workbook = new ExcelNS.Workbook()
      const sheet = workbook.addWorksheet('Participantes')

      // Encabezados
      sheet.columns = [
        { header: 'Nombre', key: 'first_name', width: 20 },
        { header: 'Apellido', key: 'last_name', width: 20 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Teléfono', key: 'phone', width: 16 },
        { header: 'Documento', key: 'identification_number', width: 18 },
        { header: 'Tipo', key: 'type', width: 14 },
        { header: 'Estado', key: 'status', width: 14 },
        { header: 'Imagen QR', key: 'qr_image', width: 18 },
      ] as any

      // Estilo de encabezado
      sheet.getRow(1).font = { bold: true }

      // Agregar filas y QR
      for (let i = 0; i < registrations.length; i++) {
        const r = registrations[i]
        const rowIndex = i + 2
        sheet.addRow({
          first_name: r.participant.first_name,
          last_name: r.participant.last_name,
          email: r.participant.email,
          phone: r.participant.phone,
          identification_number: r.participant.identification_number,
          type: r.participant.type,
          status: r.status,
        })

        // Generar QR en base64 (PNG)
        const qrText = r.registration_code
        const dataUrl = await QRCodeNS.toDataURL(qrText, { margin: 1, scale: 6 })

        const imageId = workbook.addImage({
          base64: dataUrl,
          extension: 'png'
        })

        // Columna I (index 9) para la imagen; posicionar con tamaño fijo
        sheet.addImage(imageId, {
          tl: { col: 8, row: rowIndex - 1 }, // 0-based
          ext: { width: 96, height: 96 }
        })

        // Ajustar altura de fila para ver la imagen completa ver la forma de hace
        sheet.getRow(rowIndex).height = 75
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeTitle = (event?.title || 'evento').replace(/[^a-z0-9-_ ]/gi, '')
      a.download = `Participantes_${safeTitle}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando Excel con QR', err)
      alert('No se pudo exportar el Excel con QRs')
    }
  }

  // Descargar reporte de asistencias
  const handleDownloadAttendanceReport = async () => {
    if (!eventId || !event) return

    try {
      await downloadAttendanceReportExcel(eventId, event.title)
      alert('Reporte de asistencias descargado exitosamente')
    } catch (err) {
      console.error('Error descargando reporte de asistencias:', err)
      alert('No se pudo descargar el reporte de asistencias. Por favor, intenta nuevamente.')
    }
  }

  if (loading) {
    return (
      <>
        <Row>
          <Col xs={12}>
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3 text-muted">Cargando evento...</p>
            </div>
          </Col>
        </Row>
      </>
    )
  }

  if (error || !event) {
    return (
      <>
        <Row>
          <Col xs={12}>
            <ComponentContainerCard
              id="evento-error"
              title="Evento no encontrado"
              description="Gestiona los participantes de este evento"
            >
              <div className="text-center py-5">
                <i className="ri-error-warning-line text-danger" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 text-danger">Evento no encontrado</h5>
                <p className="text-muted">{error || 'El evento solicitado no existe o no tienes permisos para verlo.'}</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/events/events-list')}
                >
                  <i className="ri-arrow-left-line me-1"></i>
                  Volver a Eventos
                </Button>
              </div>
            </ComponentContainerCard>
          </Col>
        </Row>
      </>
    )
  }

  return (
    <>

      <Row>
        <Col xs={12}>
            {/* Información del evento */}
            <Card className="mb-4 border-0 shadow-lg">
              <CardHeader style={{
                background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                  <h4 className="card-title mb-0 fw-bold" style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>
                    <i className="ri-calendar-event-line me-2"></i>
                    Información del Evento
                  </h4>
                  <Form.Select
                    value={event?.status || 'Borrador'}
                    onChange={async (e) => {
                      if (!event) return
                      const newStatus = e.target.value as 'Borrador' | 'Publicado' | 'Cancelado' | 'Completado'
                      try {
                        // Enviar todos los campos requeridos junto con el nuevo status
                        await updateEvent({
                          id: event.id,
                          title: event.title,
                          description: event.description,
                          location: event.location,
                          capacity: event.capacity,
                          start_date: event.start_date,
                          end_date: event.end_date,
                          status: newStatus,
                          requires_attendance_for_certificate: event.requires_attendance_for_certificate,
                          minimum_attendance_percentage: event.minimum_attendance_percentage,
                          registration_deadline: event.registration_deadline,
                        })
                        // Recargar el evento
                        const updatedEvent = await getEvent(event.id)
                        if (updatedEvent) {
                          setEvent(updatedEvent)
                        }
                      } catch (err: any) {
                        console.error('Error al actualizar estado:', err)
                        const errorMessage = err?.response?.data?.detail ||
                          err?.response?.data?.title?.[0] ||
                          'Error al actualizar el estado del evento'
                        alert(errorMessage)
                        // Recargar el evento para revertir el cambio visual
                        const currentEvent = await getEvent(event.id)
                        if (currentEvent) {
                          setEvent(currentEvent)
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      backgroundColor: 'white',
                      color: '#212529',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                    className="w-100 w-md-auto"
                  >
                    <option value="Borrador">Borrador</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Completado">Completado</option>
                  </Form.Select>
                </div>
              </CardHeader>
              <CardBody className="p-3 p-md-4">
                <Row>
                  <Col xs={12}>
                    <div className="text-center mb-4">
                      <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: 'var(--vris-text-primary)' }}>
                        {event.title}
                      </h2>
                      <p className="fs-5 mb-4" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem', color: 'var(--vris-text-secondary)' }}>
                        {event.description}
                      </p>
                    </div>

                    {/* Información en 1 fila con iconos dinámicos */}
                    <Row className="mb-4">
                      <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle p-3 me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                              width: '50px',
                              height: '50px',
                              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                            }}
                          >
                            <i className="ri-calendar-line text-white fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0 text-muted">Fecha de Inicio</h6>
                            <p className="mb-0 fw-semibold small">
                              {formatDateShort(event.start_date)}
                            </p>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle p-3 me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                              width: '50px',
                              height: '50px',
                              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                            }}
                          >
                            <i className="ri-time-line text-white fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0 text-muted">Fecha de Fin</h6>
                            <p className="mb-0 fw-semibold small">
                              {formatDateShort(event.end_date)}
                            </p>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle p-3 me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                              width: '50px',
                              height: '50px',
                              boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)'
                            }}
                          >
                            <i className="ri-map-pin-line text-white fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0 text-muted">Ubicación</h6>
                            <p className="mb-0 fw-semibold small">{event.location}</p>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12} sm={6} md={3}>
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle p-3 me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%)',
                              width: '50px',
                              height: '50px',
                              boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)'
                            }}
                          >
                            <i className="ri-checkbox-circle-line text-white fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0 text-muted">Estado</h6>
                            <div className="mt-1">{getStatusBadge(event.status)}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row className="rounded p-3 mb-3" style={{
                      backgroundColor: 'var(--vris-bg-secondary)',
                      border: '1px solid var(--vris-border)'
                    }}>
                      <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                        <div className="text-center">
                          <h6 className="mb-1" style={{ color: 'var(--vris-text-secondary)' }}>Capacidad Máxima</h6>
                          <h3 className="text-primary mb-0" style={{ fontWeight: 'bold' }}>{event.capacity || 'Sin límite'}</h3>
                        </div>
                      </Col>
                      <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                        <div className="text-center">
                          <h6 className="mb-1" style={{ color: 'var(--vris-text-secondary)' }}>Sesiones</h6>
                          <h3 className="text-success mb-0" style={{ fontWeight: 'bold' }}>{sessions.length}</h3>
                        </div>
                      </Col>
                      <Col xs={12} sm={4}>
                        <div className="text-center">
                          <h6 className="mb-1" style={{ color: 'var(--vris-text-secondary)' }}>Certificado Requerido</h6>
                          <h3 className="text-info mb-0" style={{ fontWeight: 'bold' }}>
                            {event.requires_attendance_for_certificate ? 'Sí' : 'No'}
                          </h3>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Sesiones del Evento */}
            <Card className="mb-4">
              <CardHeader className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                  <h5 className="card-title mb-0" style={{ color: '#ffffff', fontWeight: '700' }}>Sesiones del Evento</h5>
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>Gestiona las sesiones de asistencia</p>
                </div>
                <Button
                  variant="wine"
                  size="sm"
                  className="w-100 w-md-auto"
                  style={{
                    background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    color: '#ffffff'
                  }}
                  onClick={() => setShowSessionModal(true)}
                >
                  <i className="ri-add-line me-1"></i>
                  Nueva Sesión
                </Button>
              </CardHeader>
              <CardBody>
                {sessionsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2 text-muted">Cargando sesiones...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="ri-calendar-line text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2 text-muted">No hay sesiones creadas</p>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowDefaultSessionModal(true)}
                      style={{
                        backgroundColor: '#0a192f',
                        borderColor: '#0a192f',
                        color: '#ffffff',
                        borderWidth: '2px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#112240'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.borderColor = '#112240'
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0a192f'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.borderColor = '#0a192f'
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <i className="ri-add-line me-1"></i>
                      Crear Sesión Principal
                    </Button>
                  </div>
                ) : (
                  <Row>
                    {sessions.map((session, index) => {
                      // Convertir horarios a formato AM/PM
                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(':')
                        const hour = parseInt(hours)
                        const ampm = hour >= 12 ? 'PM' : 'AM'
                        const displayHour = hour % 12 || 12
                        return `${displayHour}:${minutes} ${ampm}`
                      }

                      return (
                        <Col xs={12} sm={6} lg={4} key={session.id} className="mb-3">
                          <Card className="h-100 shadow-lg" style={{
                            backgroundColor: 'var(--vris-bg-secondary)',
                            border: '1px solid rgba(255, 193, 7, 0.15)',
                            transform: 'translateY(0)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-5px)'
                              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)'
                              e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                              e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.15)'
                            }}>
                            <CardBody className="p-3 p-md-4">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h5 className="card-title mb-0 fw-bold" style={{ color: '#ffffff' }}>
                                  {session.session_name || `Sesión ${index + 1}`}
                                </h5>
                                <Badge
                                  bg="primary"
                                  className="badge-sm px-3 py-2"
                                  style={{
                                    background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                                    border: 'none'
                                  }}
                                >
                                  Sesión {index + 1}
                                </Badge>
                              </div>

                              <div className="mb-4">
                                <div className="d-flex align-items-center mb-3">
                                  <div
                                    className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center"
                                    style={{
                                      background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                                      width: '40px',
                                      height: '40px',
                                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)'
                                    }}
                                  >
                                    <i className="ri-calendar-line text-white"></i>
                                  </div>
                                  <div>
                                    <small className="d-block" style={{ color: 'var(--vris-text-muted)' }}>Fecha</small>
                                    <strong style={{ color: 'var(--vris-text-primary)' }}>
                                      {formatDateToSpanish(session.session_date)}
                                    </strong>
                                  </div>
                                </div>

                                <div className="d-flex align-items-center mb-3">
                                  <div
                                    className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center"
                                    style={{
                                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                      width: '40px',
                                      height: '40px',
                                      boxShadow: '0 3px 10px rgba(40, 167, 69, 0.3)'
                                    }}
                                  >
                                    <i className="ri-time-line text-white"></i>
                                  </div>
                                  <div>
                                    <small className="d-block" style={{ color: 'var(--vris-text-muted)' }}>Horario</small>
                                    <strong style={{ color: 'var(--vris-text-primary)' }}>
                                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                    </strong>
                                  </div>
                                </div>

                                <div className="d-flex align-items-center">
                                  <div
                                    className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center"
                                    style={{
                                      background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                                      width: '40px',
                                      height: '40px',
                                      boxShadow: '0 3px 10px rgba(255, 193, 7, 0.3)'
                                    }}
                                  >
                                    <i className="ri-map-pin-line text-white"></i>
                                  </div>
                                  <div>
                                    <small className="d-block" style={{ color: 'var(--vris-text-muted)' }}>Ubicación</small>
                                    <strong style={{ color: 'var(--vris-text-primary)' }}>{event.location || 'Presencial'}</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="d-flex gap-2 flex-column flex-sm-row">
                                <Button
                                  variant="wine"
                                  size="sm"
                                  className="flex-fill"
                                  style={{
                                    background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onClick={() => {
                                    navigate(`/events/${eventId}/sessions/${session.id}/attendance`)
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #112240 0%, #0a192f 100%)'
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #0a192f 0%, #112240 100%)'
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                  }}
                                >
                                  <i className="ri-user-line me-1"></i>
                                  <span className="d-none d-sm-inline">Gestionar </span>Asistencia
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={() => handleEditSession(session)}
                                  style={{
                                    backgroundColor: '#0a192f',
                                    borderColor: '#0a192f',
                                    color: '#ffffff',
                                    borderWidth: '2px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#112240'
                                    e.currentTarget.style.color = '#ffffff'
                                    e.currentTarget.style.borderColor = '#112240'
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#0a192f'
                                    e.currentTarget.style.color = '#ffffff'
                                    e.currentTarget.style.borderColor = '#0a192f'
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                  }}
                                >
                                  <i className="ri-edit-line"></i>
                                  <span className="d-none d-sm-inline ms-1">Editar</span>
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                )}
              </CardBody>
            </Card>

            {/* Lista de participantes */}
            <Card className="border-0 shadow-lg">
              <CardHeader style={{
                background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem'
              }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                  <div style={{ minWidth: 0, flex: '1 1 auto', maxWidth: '100%' }}>
                    <h4 className="card-title mb-0 fw-bold" style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)', whiteSpace: 'nowrap' }}>
                      <i className="ri-user-line me-2"></i>
                      Lista de Participantes
                    </h4>
                    <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)', whiteSpace: 'nowrap' }}>Control de asistencia por sesiones</p>
                  </div>
                  <div className="d-flex flex-wrap gap-2" style={{ flexShrink: 0, marginLeft: 'auto' }}>
                    <input type="file" accept=".xlsx,.xls" id="excel-upload" className="d-none" onChange={handleExcelChange} />
                    <Button
                      variant="light"
                      size="sm"
                      className="flex-fill flex-md-grow-0"
                      onClick={() => {
                        document.getElementById('excel-upload')?.click()
                      }}
                      style={{
                        backgroundColor: '#0a192f',
                        borderColor: '#0a192f',
                        borderWidth: '2px',
                        color: '#ffffff',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#112240'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.borderColor = '#112240'
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0a192f'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.borderColor = '#0a192f'
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <i className="ri-upload-2-line me-1"></i>
                      <span className="d-none d-sm-inline">Importar </span>Excel
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill flex-md-grow-0"
                      onClick={() => setShowParticipantModal(true)}
                      style={{
                        backgroundColor: '#0a192f',
                        borderColor: '#0a192f',
                        color: '#ffffff',
                        borderWidth: '2px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#112240'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.borderColor = '#112240'
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0a192f'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.borderColor = '#0a192f'
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <i className="ri-user-add-line me-1"></i>
                      <span className="d-none d-sm-inline">Añadir </span>Participante
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-fill flex-md-grow-0"
                      disabled={!excelFile}
                      onClick={handleExcelUpload}
                      style={{
                        color: '#ffffff'
                      }}
                    >
                      <i className="ri-check-line me-1"></i>
                      Cargar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-3 p-md-4">
                {registrationsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando participantes...</p>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="ri-user-line text-primary" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="text-muted mb-3">No hay participantes registrados</h4>
                    <p className="text-muted mb-4 fs-5">
                      Los participantes aparecerán aquí cuando se registren al evento
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                      <Button
                        variant="primary"
                        size="lg"
                        style={{
                          background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px 30px',
                          fontWeight: '600'
                        }}
                        onClick={() => setShowParticipantModal(true)}
                      >
                        <i className="ri-user-add-line me-2"></i>
                        Registrar Participante
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Barra de búsqueda */}
                    <div className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Buscar participante por nombre, email, teléfono o código QR..."
                        value={participantSearchInTable}
                        onChange={(e) => {
                          setParticipantSearchInTable(e.target.value)
                        }}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e0e0e0',
                          padding: '10px 15px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    {/* Tabla sin scroll infinito */}
                    <div
                      className="table-responsive"
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px'
                      }}
                    >
                      <table className="table table-hover table-dark-header mb-0" style={{ minWidth: '800px' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0a192f', zIndex: 10 }}>
                          <tr>
                            <th style={{ minWidth: '150px', color: '#ffffff' }}>Participante</th>
                            <th style={{ minWidth: '100px', color: '#ffffff' }}>Tipo</th>
                            <th style={{ minWidth: '150px', color: '#ffffff' }} className="d-none d-md-table-cell">Email</th>
                            <th style={{ minWidth: '120px', color: '#ffffff' }} className="d-none d-lg-table-cell">Teléfono</th>
                            <th style={{ minWidth: '100px', color: '#ffffff' }}>Estado</th>
                            <th style={{ minWidth: '150px', color: '#ffffff' }} className="d-none d-md-table-cell">Sesiones Asistidas</th>
                            <th style={{ minWidth: '150px', color: '#ffffff' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRegistrations.map((registration) => {
                            return (
                              <tr key={`${registration.id}-${registration.participant.id}`}>
                                <td>
                                  <div>
                                    <strong>{registration.participant.first_name} {registration.participant.last_name}</strong>
                                    {registration.participant.career && (
                                      <div className="text-muted small">{registration.participant.career}</div>
                                    )}
                                    <div className="d-md-none mt-1">
                                      <small className="text-muted d-block">{registration.participant.email}</small>
                                      <small className="text-muted">{registration.participant.phone}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>{getParticipantTypeBadge(registration.participant.type)}</td>
                                <td className="d-none d-md-table-cell">{registration.participant.email}</td>
                                <td className="d-none d-lg-table-cell">{registration.participant.phone}</td>
                                <td>{getRegistrationStatusBadge(registration.status)}</td>
                                <td>
                                  {renderAttendanceCircles(registration.participant.id)}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditParticipant(registration)}
                                      title="Editar Email"
                                      style={{
                                        background: 'linear-gradient(135deg, #0066CC 0%, #0099FF 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.4rem 0.8rem',
                                        color: 'white',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                      }}
                                    >
                                      <i className="ri-edit-line"></i>
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleResendQR(registration)}
                                      title="Reenviar QR"
                                      style={{
                                        background: 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.4rem 0.8rem',
                                        color: 'white',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                      }}
                                    >
                                      <i className="ri-mail-send-line"></i>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación y botón de descarga */}
                    <div className="d-flex flex-column gap-3 mt-3">
                      {/* Fila 1: Info y botones de descarga */}
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                        <div className="text-muted small">
                          {`Mostrando ${startIndex + 1}-${Math.min(endIndex, filteredRegistrations.length)} de ${filteredRegistrations.length} participantes${participantSearchInTable ? ' (filtrados)' : ''}`}
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={exportQrExcel}
                            style={{
                              backgroundColor: '#28a745',
                              borderColor: '#28a745',
                              color: '#ffffff',
                              borderWidth: '2px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#34ce57'
                              e.currentTarget.style.color = '#ffffff'
                              e.currentTarget.style.borderColor = '#34ce57'
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#28a745'
                              e.currentTarget.style.color = '#ffffff'
                              e.currentTarget.style.borderColor = '#28a745'
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            <i className="ri-file-excel-2-line me-1"></i>
                            Descargar Excel con QR
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleDownloadAttendanceReport}
                            style={{
                              backgroundColor: '#0a192f',
                              borderColor: '#0a192f',
                              color: '#ffffff',
                              borderWidth: '2px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#112240'
                              e.currentTarget.style.color = '#ffffff'
                              e.currentTarget.style.borderColor = '#112240'
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#0a192f'
                              e.currentTarget.style.color = '#ffffff'
                              e.currentTarget.style.borderColor = '#0a192f'
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            <i className="ri-file-chart-line me-1"></i>
                            Reporte de Asistencias
                          </Button>
                        </div>
                      </div>

                      {/* Fila 2: Controles de paginación */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center">
                          <div className="d-flex align-items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              style={{ borderRadius: '8px', fontWeight: '600', padding: '0.4rem 0.8rem' }}
                            >
                              <i className="ri-arrow-left-s-line"></i>
                            </Button>

                            <div className="d-flex gap-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                  return (
                                    <Button
                                      key={page}
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      style={{
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        minWidth: '35px',
                                        background: 'transparent',
                                        border: currentPage === page ? '2px solid #0a192f' : '1px solid #dee2e6',
                                        color: currentPage === page ? '#0a192f' : '#6c757d',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (currentPage !== page) {
                                          e.currentTarget.style.borderColor = '#0a192f'
                                          e.currentTarget.style.color = '#0a192f'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (currentPage !== page) {
                                          e.currentTarget.style.borderColor = '#dee2e6'
                                          e.currentTarget.style.color = '#6c757d'
                                        }
                                      }}
                                    >
                                      {page}
                                    </Button>
                                  )
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                  return <span key={page} className="px-1">...</span>
                                }
                                return null
                              })}
                            </div>

                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              style={{ borderRadius: '8px', fontWeight: '600', padding: '0.4rem 0.8rem' }}
                            >
                              <i className="ri-arrow-right-s-line"></i>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
        </Col>
      </Row>

      {/* Modal de Registro de Participantes */}
      <Modal
        show={showParticipantModal}
        onHide={() => setShowParticipantModal(false)}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
            color: 'white'
          }}
        >
          <Modal.Title style={{ color: '#FFFFFF', fontWeight: '700' }}>
            <i className="ri-user-add-line me-2"></i>
            Registrar Nuevo Participante
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleParticipantSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Buscar participante existente</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Escribe nombre o email y selecciona"
                    value={participantSearch}
                    onChange={(e) => {
                      setParticipantSearch(e.target.value)
                      searchParticipants(e.target.value)
                      setSelectedParticipant(null)
                    }}
                  />
                  {searchResults.length > 0 && (
                    <div className="border rounded mt-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover-bg"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelectExistingParticipant(p)}
                        >
                          <strong>{p.first_name} {p.last_name}</strong> <span className="text-muted">- {p.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedParticipant && (
                    <div className="mt-2 small">
                      Seleccionado: <strong>{selectedParticipant.first_name} {selectedParticipant.last_name}</strong> ({selectedParticipant.email})
                      <Button variant="link" size="sm" onClick={resetParticipantForm}>Cambiar</Button>
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre"
                    value={participantForm.first_name}
                    onChange={(e) => setParticipantForm({ ...participantForm, first_name: e.target.value })}
                    disabled={!!selectedParticipant}
                    required={!selectedParticipant}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Apellido"
                    value={participantForm.last_name}
                    onChange={(e) => setParticipantForm({ ...participantForm, last_name: e.target.value })}
                    disabled={!!selectedParticipant}
                    required={!selectedParticipant}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={participantForm.email}
                    onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                    disabled={!!selectedParticipant}
                    required={!selectedParticipant}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="300 000 0000"
                    value={participantForm.phone}
                    onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })}
                    disabled={!!selectedParticipant}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento (CI/DNI)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Número de identificación"
                    value={participantForm.identification_number}
                    onChange={(e) => setParticipantForm({ ...participantForm, identification_number: e.target.value })}
                    disabled={!!selectedParticipant}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo *</Form.Label>
                  <Form.Select
                    value={participantForm.type}
                    onChange={(e) => setParticipantForm({ ...participantForm, type: e.target.value })}
                    disabled={!!selectedParticipant}
                    required={!selectedParticipant}
                  >
                    <option value="Estudiante">Estudiante</option>
                    <option value="Profesional">Profesional</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Carrera/Profesión</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingeniería, Medicina, etc."
                    value={participantForm.career}
                    onChange={(e) => setParticipantForm({ ...participantForm, career: e.target.value })}
                    disabled={!!selectedParticipant}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowParticipantModal(false)}
          >
            <i className="ri-close-line me-1"></i>
            Cancelar
          </Button>
          <Button
            variant="primary"
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              border: 'none'
            }}
            onClick={handleParticipantSubmit}
          >
            <i className="ri-user-add-line me-1"></i>
            Registrar Participante
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Nueva Sesión */}
      <Modal
        show={showSessionModal}
        onHide={() => setShowSessionModal(false)}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
            color: 'white'
          }}
        >
          <Modal.Title style={{ color: '#FFFFFF', fontWeight: '700' }}>
            <i className="ri-calendar-event-line me-2"></i>
            Crear Nueva Sesión
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Mostrar sesiones existentes para evitar conflictos */}
          {sessions.length > 0 && (
            <div className="mb-4">
              <h6 className="text-muted mb-3">
                <i className="ri-information-line me-1"></i>
                Sesiones Existentes
              </h6>
              <div className="bg-light p-3 rounded">
                {sessions.map((session, index) => (
                  <div key={session.id} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{session.session_name || `Sesión ${index + 1}`}</strong>
                      <small className="text-muted d-block">
                        {formatDateShort(session.session_date)} -
                        {session.start_time.substring(0, 5)} a {session.end_time.substring(0, 5)}
                      </small>
                    </div>
                    <Badge bg="info">Existente</Badge>
                  </div>
                ))}
              </div>
              <small className="text-muted">
                <i className="ri-alert-line me-1"></i>
                No puedes crear sesiones con la misma fecha y hora de inicio
              </small>
            </div>
          )}

          <Form onSubmit={handleSessionSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Sesión *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Sesión Matutina, Sesión Vespertina, etc."
                    value={sessionForm.session_name}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de la Sesión *</Form.Label>
                  <Form.Control
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <TimeInput
                  label="Hora de Inicio"
                  value={sessionForm.start_time}
                  onChange={(value) => setSessionForm({ ...sessionForm, start_time: value })}
                  required
                />
              </Col>
              <Col md={3}>
                <TimeInput
                  label="Hora de Fin"
                  value={sessionForm.end_time}
                  onChange={(value) => setSessionForm({ ...sessionForm, end_time: value })}
                  required
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSessionModal(false)}
          >
            <i className="ri-close-line me-1"></i>
            Cancelar
          </Button>
          <Button
            variant="primary"
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              border: 'none'
            }}
            onClick={handleSessionSubmit}
          >
            <i className="ri-calendar-event-line me-1"></i>
            Crear Sesión
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Sesión Principal */}
      <Modal
        show={showDefaultSessionModal}
        onHide={() => setShowDefaultSessionModal(false)}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
            color: 'white'
          }}
        >
          <Modal.Title style={{ color: '#FFFFFF', fontWeight: '700' }}>
            <i className="ri-calendar-event-line me-2"></i>
            Crear Sesión Principal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleDefaultSessionSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Sesión *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Sesión Principal, Sesión Matutina, etc."
                    value={defaultSessionForm.session_name}
                    onChange={(e) => setDefaultSessionForm({ ...defaultSessionForm, session_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de la Sesión *</Form.Label>
                  <Form.Control
                    type="date"
                    value={defaultSessionForm.session_date}
                    onChange={(e) => setDefaultSessionForm({ ...defaultSessionForm, session_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <TimeInput
                  label="Hora de Inicio"
                  value={defaultSessionForm.start_time}
                  onChange={(value) => setDefaultSessionForm({ ...defaultSessionForm, start_time: value })}
                  required
                />
              </Col>
              <Col md={3}>
                <TimeInput
                  label="Hora de Fin"
                  value={defaultSessionForm.end_time}
                  onChange={(value) => setDefaultSessionForm({ ...defaultSessionForm, end_time: value })}
                  required
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDefaultSessionModal(false)}
          >
            <i className="ri-close-line me-1"></i>
            Cancelar
          </Button>
          <Button
            variant="primary"
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              border: 'none'
            }}
            onClick={handleDefaultSessionSubmit}
          >
            <i className="ri-calendar-event-line me-1"></i>
            Crear Sesión Principal
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Edición de Sesión */}
      <Modal
        show={showEditSessionModal}
        onHide={() => setShowEditSessionModal(false)}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
            color: 'white'
          }}
        >
          <Modal.Title style={{ color: '#FFFFFF', fontWeight: '700' }}>
            <i className="ri-edit-line me-2"></i>
            Editar Sesión
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSessionSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Sesión *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Sesión Matutina, Sesión Vespertina, etc."
                    value={editSessionForm.session_name}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, session_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de la Sesión *</Form.Label>
                  <Form.Control
                    type="date"
                    value={editSessionForm.session_date}
                    onChange={(e) => {
                      // Guardar la fecha directamente en formato YYYY-MM-DD
                      // Django está configurado para Bolivia, no hay conversión de zona horaria
                      setEditSessionForm({ ...editSessionForm, session_date: e.target.value })
                    }}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <TimeInput
                  label="Hora de Inicio"
                  value={editSessionForm.start_time}
                  onChange={(value) => setEditSessionForm({ ...editSessionForm, start_time: value })}
                  required
                />
              </Col>
              <Col md={3}>
                <TimeInput
                  label="Hora de Fin"
                  value={editSessionForm.end_time}
                  onChange={(value) => setEditSessionForm({ ...editSessionForm, end_time: value })}
                  required
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditSessionModal(false)}
          >
            <i className="ri-close-line me-1"></i>
            Cancelar
          </Button>
          <Button
            variant="primary"
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              border: 'none'
            }}
            onClick={handleEditSessionSubmit}
          >
            <i className="ri-edit-line me-1"></i>
            Actualizar Sesión
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Editar Email del Participante */}
      <Modal show={showEditParticipantModal} onHide={() => setShowEditParticipantModal(false)} centered>
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className="ri-edit-line me-2"></i>
            Editar Email del Participante
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {editingParticipant && (
            <>
              <div className="mb-3">
                <strong>Participante:</strong> {editingParticipant.participant.first_name} {editingParticipant.participant.last_name}
              </div>
              <Form.Group>
                <Form.Label style={{ fontWeight: '600', color: '#0a192f' }}>
                  <i className="ri-mail-line me-2"></i>
                  Nuevo Email
                </Form.Label>
                <Form.Control
                  type="email"
                  value={editParticipantEmail}
                  onChange={(e) => setEditParticipantEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
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
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '1.5rem 2rem' }}>
          <Button
            variant="secondary"
            onClick={() => setShowEditParticipantModal(false)}
            style={{
              borderRadius: '8px',
              padding: '0.6rem 1.5rem',
              fontWeight: '600'
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveParticipantEmail}
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.5rem',
              fontWeight: '600'
            }}
          >
            <i className="ri-save-line me-2"></i>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmación Reenviar QR */}
      <Modal show={showResendQRModal} onHide={() => setShowResendQRModal(false)} centered>
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className="ri-mail-send-line me-2"></i>
            Reenviar Código QR
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {editingParticipant && (
            <div>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                ¿Estás seguro de reenviar el código QR por email?
              </p>
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0'
              }}>
                <div><strong>Participante:</strong> {editingParticipant.participant.first_name} {editingParticipant.participant.last_name}</div>
                <div className="mt-2">
                  <i className="ri-mail-line me-2"></i>
                  <strong>Email:</strong> {editingParticipant.participant.email}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '1.5rem 2rem' }}>
          <Button
            variant="secondary"
            onClick={() => setShowResendQRModal(false)}
            style={{
              borderRadius: '8px',
              padding: '0.6rem 1.5rem',
              fontWeight: '600'
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmResendQR}
            style={{
              background: 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.5rem',
              fontWeight: '600'
            }}
          >
            <i className="ri-mail-send-line me-2"></i>
            Reenviar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Éxito/Error */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header
          closeButton
          style={{
            background: modalKind === 'error'
              ? 'linear-gradient(135deg, #dc3545 0%, #ff4757 100%)'
              : modalKind === 'warning'
                ? 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)'
                : 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>{modalMessage.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          padding: '2rem',
          backgroundColor: '#ffffff',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          <p style={{
            fontSize: '1.05rem',
            whiteSpace: 'pre-line',
            marginBottom: 0,
            color: '#2c3e50 !important',
            fontFamily: 'monospace',
            lineHeight: '1.6'
          }}>
            {modalMessage.message}
          </p>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '1.5rem 2rem' }}>
          <Button
            onClick={() => setShowSuccessModal(false)}
            style={{
              background: modalKind === 'error'
                ? 'linear-gradient(135deg, #dc3545 0%, #ff4757 100%)'
                : modalKind === 'warning'
                  ? 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)'
                  : 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 2rem',
              fontWeight: '600'
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  )
}

export default EventDetail
