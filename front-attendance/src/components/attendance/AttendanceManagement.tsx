import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardBody, CardHeader, Row, Col, Button, Form, Alert, Badge, Table } from 'react-bootstrap'
import { Html5Qrcode } from 'html5-qrcode'
import { useAttendance, CheckInData } from '@/hooks/useAttendance'
import { useEventRegistrations } from '@/hooks/useEventRegistrations'
import ComponentContainerCard from '@/components/ComponentContainerCard'

interface AttendanceManagementProps {
  sessionId: string
  eventId: string
  sessionName: string
  sessionDate: string
  startTime: string
  endTime: string
}

// Componente memoizado para la última asistencia (solo se actualiza cuando cambia lastAttendanceParticipant)
const LastAttendanceCard = React.memo<{ 
  participant: any | null, 
  loading: boolean,
  formatDate12h: (date: string | null | undefined) => string
}>(({ participant, loading, formatDate12h }) => {
  if (loading) {
    return (
      <ComponentContainerCard
        id="last-attendance-card"
        title="Última asistencia registrada"
        description="Cargando información del participante..."
      >
        <Card className="border-primary">
          <CardBody>
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Actualizando última asistencia...</p>
            </div>
          </CardBody>
        </Card>
      </ComponentContainerCard>
    )
  }

  if (!participant) return null

  return (
    <ComponentContainerCard
      id="last-attendance-card"
      title="Última asistencia registrada"
      description="Este participante fue el último en registrar asistencia en esta sesión"
    >
      <Card className="border-success">
        <CardHeader className="bg-success text-white">
          <h5 className="mb-0">
            <i className="ri-user-check-line me-2"></i>
            Última asistencia
          </h5>
        </CardHeader>
        <CardBody>
          <div className="text-center mb-3">
            <div
              className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                width: '80px',
                height: '80px',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {participant.participant.first_name?.[0]?.toUpperCase() || ''}
              {participant.participant.last_name?.[0]?.toUpperCase() || ''}
            </div>
          </div>
          <div className="row text-center">
            <div className="col-12">
              <h4 className="text-success mb-2">
                {participant.participant.first_name} {participant.participant.last_name}
              </h4>
              <p className="text-muted">{participant.participant.email}</p>
            </div>
          </div>
          <div className="row mt-2 text-center">
            <div className="col-6">
              <small className="text-muted d-block">Documento</small>
              <strong>{participant.participant.identification_number}</strong>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Hora</small>
              <strong>{formatDate12h(participant.checked_in_at)}</strong>
            </div>
          </div>
        </CardBody>
      </Card>
    </ComponentContainerCard>
  )
})

LastAttendanceCard.displayName = 'LastAttendanceCard'

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  sessionId,
  eventId,
  sessionName,
  sessionDate,
  startTime,
  endTime
}) => {
  const { attendances, checkIn, fetchAttendances } = useAttendance(sessionId)
  const { registrations, loading: registrationsLoading, fetchRegistrations } = useEventRegistrations(eventId)
  
  // Estado local para las asistencias (para actualizaciones inmediatas)
  const [localAttendances, setLocalAttendances] = useState<any[]>([])
  
  // Sincronizar localAttendances con attendances
  useEffect(() => {
    setLocalAttendances(attendances)
  }, [attendances])

  const [qrCode, setQrCode] = useState('')
  // Notas eliminadas del flujo para simplificar el registro
  const [checkingIn, setCheckingIn] = useState(false)
  const [scannedParticipant, setScannedParticipant] = useState<any>(null)
  const [showSuccessCard, setShowSuccessCard] = useState(false)
  const [checkStatus, setCheckStatus] = useState<'created' | 'already' | 'error' | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState('')
  const [lastAttendanceParticipant, setLastAttendanceParticipant] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [scannerActive, setScannerActive] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const animationTimeoutRef = useRef<number | null>(null)
  const cameraRestartTimeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialLoadRef = useRef(false)

  // Memoizar el formateo de fecha para evitar recrearlo
  const formatDate12h = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return 'â€“'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'â€“'
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }, [])

  // Filtrar participantes
  const filteredRegistrations = registrations.filter(reg => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${reg.participant.first_name} ${reg.participant.last_name}`.toLowerCase()
    const email = reg.participant.email.toLowerCase()
    const identification = reg.participant.identification_number?.toLowerCase() || ''

    return fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      identification.includes(searchLower)
  })

  // Calcular paginación
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex)

  // Resetear a página 1 cuando se busca
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])


  // Cargar datos al montar el componente (solo una vez)
  useEffect(() => {
    // Solo cargar una vez al montar
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      fetchAttendances(sessionId)
      fetchRegistrations(eventId)
    }
  }, [sessionId, eventId, fetchAttendances, fetchRegistrations])

  // Función para procesar automáticamente el QR cuando cambia
  const processQRCode = async (code: string) => {
    if (!code.trim()) return
    if (checkingIn) return

    // Evitar procesar el mismo código dos veces seguidas
    if (code.trim() === lastScannedCode) {
      console.log('âš ï¸ Código ya procesado recientemente, ignorando...')
      return
    }

    console.log('ðŸ” Procesando código QR:', code)
    setLastScannedCode(code.trim())

    // Buscar el participante por código QR
    const registration = registrations.find(reg => reg.registration_code === code.trim())

    if (!registration) {
      console.log('âŒ Participante no encontrado con código:', code)
      return
    }

    console.log('âœ… Participante encontrado:', registration.participant.first_name)
    setScannedParticipant(registration)

    // Registrar asistencia automáticamente
    setCheckingIn(true)
    try {
      const checkInData: CheckInData = {
        registration_code: code.trim(),
        session_id: sessionId
      }

      const result = await checkIn(checkInData)

      if (result.success) {
        // Actualizar INMEDIATAMENTE sin esperar fetch
        if (result.attendance) {
          const att = result.attendance
          // Añadir al inicio del array local para que aparezca inmediatamente
          setLocalAttendances(prev => [att, ...prev])
          
          // Actualizar el participante escaneado
          setScannedParticipant({
            participant: att.registration.participant,
            registration_code: att.registration.registration_code,
            checked_in_at: att.checked_in_at || new Date().toISOString()
          })
        } else if (registration) {
          setScannedParticipant({
            ...registration,
            checked_in_at: new Date().toISOString()
          })
        }
        setCheckStatus('created')
        setQrCode('')

        // NO hacemos fetch - la actualización local es suficiente
        // El backend ya confirmó el registro y tenemos los datos

        // Limpiar timeouts anteriores si existen
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current)
          animationTimeoutRef.current = null
        }
        if (cameraRestartTimeoutRef.current) {
          clearTimeout(cameraRestartTimeoutRef.current)
          cameraRestartTimeoutRef.current = null
        }
      } else {
        // Ya estaba registrado - mostrar card brevemente
        setCheckStatus('already')
        setQrCode('')

        // Limpiar timeouts anteriores si existen
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current)
          animationTimeoutRef.current = null
        }
        if (cameraRestartTimeoutRef.current) {
          clearTimeout(cameraRestartTimeoutRef.current)
          cameraRestartTimeoutRef.current = null
        }
      }
    } catch (err) {
      console.error('âŒ Error al registrar asistencia:', err)
      setCheckStatus('error')
      setShowSuccessCard(true)
      setQrCode('')

      // Limpiar timeouts anteriores si existen
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      if (cameraRestartTimeoutRef.current) {
        clearTimeout(cameraRestartTimeoutRef.current)
      }

      const errorTimeoutId = window.setTimeout(() => {
        setLastScannedCode('')
        const restartTimeoutId = window.setTimeout(() => {
          console.log('ðŸ”„ Reactivando cámara automáticamente después de error...')
          startScanner()
        }, 500)
        cameraRestartTimeoutRef.current = restartTimeoutId
      }, 2000)
      animationTimeoutRef.current = errorTimeoutId
    } finally {
      setCheckingIn(false)
    }
  }

  // Detectar cambios en el código QR
  useEffect(() => {
    if (qrCode.trim() && qrCode.length > 10) { // Solo procesar códigos QR válidos
      const timeoutId = setTimeout(() => {
        processQRCode(qrCode)
      }, 300) // Reducido a 300ms para respuesta más rápida

      return () => clearTimeout(timeoutId)
    }
  }, [qrCode])

  // Auto-focus al input cuando termina el check-in
  useEffect(() => {
    if (!checkingIn && !scannerActive) {
      // Pequeño delay para asegurar que el input esté habilitado y renderizado
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [checkingIn, scannerActive])



  useEffect(() => {
    if (localAttendances && localAttendances.length > 0) {
      const sorted = [...localAttendances].sort((a, b) => {
        const timeA = a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0
        const timeB = b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0
        return timeB - timeA
      })
      setLastAttendanceParticipant({
        participant: sorted[0].registration.participant,
        registration_code: sorted[0].registration.registration_code,
        checked_in_at: sorted[0].checked_in_at || new Date().toISOString()
      })
    } else {
      setLastAttendanceParticipant(null)
    }
  }, [localAttendances])

  const handleCheckIn = async () => {
    if (!qrCode.trim()) {
      alert('Por favor ingrese el código QR')
      return
    }

    if (checkingIn) return
    setCheckingIn(true)
    try {
      // Normalizar el código: algunas pistolas envían UUIDs con "/" en lugar de "-"
      const normalizedCode = qrCode.trim().replace(/\//g, '-')

      const checkInData: CheckInData = {
        registration_code: normalizedCode,
        session_id: sessionId
      }

      const result = await checkIn(checkInData)

      if (result.success) {
        // Actualizar INMEDIATAMENTE sin esperar fetch
        if (result.attendance) {
          // Añadir al inicio del array local
          setLocalAttendances(prev => [result.attendance!, ...prev])
          
          setScannedParticipant({
            participant: result.attendance.registration.participant,
            registration_code: result.attendance.registration.registration_code,
            checked_in_at: result.attendance.checked_in_at || new Date().toISOString()
          })
        }
        setCheckStatus('created')
        setQrCode('')

        // NO hacemos fetch - la actualización local es suficiente
      } else {
        // Ya estaba registrado
        setCheckStatus('already')
        setQrCode('')
      }
    } finally {
      setCheckingIn(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckIn()
    }
  }

  const getStatusBadge = (status: string) => {
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

  // Función para iniciar el escáner de cámara (ahora solo cambia el estado)
  const startScanner = () => {
    setScannerActive(true)
  }

  // Función para detener el escáner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        console.log('Deteniendo escáner...')
        await scannerRef.current.stop()
        await scannerRef.current.clear()
        scannerRef.current = null
        setScannerActive(false)
        console.log('Escáner detenido correctamente')
      } catch (err) {
        console.error('Error deteniendo escáner:', err)
        // Forzar limpieza incluso si hay error
        scannerRef.current = null
        setScannerActive(false)
      }
    } else {
      setScannerActive(false)
    }
  }

  // Efecto para manejar el inicio/parada del escáner cuando cambia scannerActive
  useEffect(() => {
    let isMounted = true

    const initializeScanner = async () => {
      if (!scannerActive) return

      // Esperar un momento para asegurar que el DOM esté renderizado
      await new Promise(resolve => setTimeout(resolve, 200))

      if (!isMounted || !scannerActive) return

      try {
        // Verificar que el elemento del DOM existe y está visible
        const qrReaderElement = document.getElementById("qr-reader")
        if (!qrReaderElement) {
          console.error('âŒ Elemento qr-reader no encontrado')
          if (isMounted) setScannerActive(false)
          return
        }

        // Verificar que no hay un escáner activo
        if (scannerRef.current) {
          console.log('ðŸ›‘ Limpiando escáner anterior...')
          try {
            await scannerRef.current.stop()
            scannerRef.current.clear()
          } catch (e) {
            console.error('Error limpiando escáner anterior:', e)
          }
          scannerRef.current = null
          await new Promise(resolve => setTimeout(resolve, 300))
        }

        if (!isMounted || !scannerActive) return

        console.log('ðŸ“· Iniciando detección de cámaras...')

        // Intentar obtener las cámaras disponibles
        let devices: any[] = []
        try {
          devices = await Html5Qrcode.getCameras()
          console.log('ðŸ“· Cámaras encontradas:', devices.length, devices.map(d => d.label))
        } catch (cameraError: any) {
          console.error('âŒ Error obteniendo cámaras:', cameraError)
          if (cameraError.name === 'NotAllowedError' || cameraError.name === 'PermissionDeniedError') {
            alert('Permiso de cámara denegado.\n\nPor favor:\n1. Haz clic en el ícono de candado en la barra de direcciones\n2. Permite el acceso a la cámara\n3. Recarga la página y vuelve a intentar')
            if (isMounted) setScannerActive(false)
            return
          }
          throw cameraError
        }

        if (devices.length === 0) {
          alert('No se encontraron cámaras disponibles.\n\nVerifica que:\n- La cámara esté conectada\n- No esté siendo usada por otra aplicación\n- Los permisos del navegador estén habilitados')
          if (isMounted) setScannerActive(false)
          return
        }

        if (!isMounted || !scannerActive) return

        // Crear la instancia del escáner
        const scanner = new Html5Qrcode("qr-reader")

        // Preferir cámara trasera en móviles, o la primera disponible
        const preferredCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('trasera')
        )

        const selectedCameraId = preferredCamera?.id || devices[0].id
        console.log('ðŸ“· Usando cámara:', preferredCamera?.label || devices[0].label)

        // Calcular el tamaño del qrbox basado en el ancho disponible
        const qrboxWidth = Math.min(300, qrReaderElement.clientWidth - 40)
        const qrboxHeight = qrboxWidth

        await scanner.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: { width: qrboxWidth, height: qrboxHeight },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: preferredCamera ? undefined : "environment"
            }
          },
          (decodedText) => {
            // Cuando se detecta un QR, procesarlo automáticamente
            console.log('ðŸ“· QR detectado por cámara:', decodedText)
            if (isMounted && scannerActive) {
              // Detener el escáner primero para evitar lecturas múltiples
              stopScanner()
              // Luego procesar el QR
              processQRCode(decodedText)
            }
          },
          (_errorMessage) => {
            // Errores silenciosos durante el escaneo
          }
        )

        scannerRef.current = scanner
        console.log('âœ… Escáner iniciado correctamente')
      } catch (err: any) {
        console.error('âŒ Error iniciando escáner:', err)
        console.error('Detalles del error:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        })

        // Limpiar el estado en caso de error
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop().catch(() => {
              // Ignorar errores al detener
            })
            scannerRef.current.clear()
          } catch (cleanupError) {
            console.error('Error limpiando escáner:', cleanupError)
          }
          scannerRef.current = null
        }

        if (isMounted) setScannerActive(false)

        // Mensajes de error más específicos
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('Permiso de cámara denegado.\n\nPor favor:\n1. Haz clic en el ícono de candado ðŸ”’ en la barra de direcciones\n2. Permite el acceso a la cámara\n3. Recarga la página y vuelve a intentar')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          alert('No se encontraron cámaras disponibles.\n\nVerifica que:\n- La cámara esté conectada\n- No esté siendo usada por otra aplicación\n- Los permisos del navegador estén habilitados')
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          alert('No se pudo iniciar la cámara.\n\nPosibles causas:\n- La cámara está siendo usada por otra aplicación\n- El dispositivo no tiene permisos suficientes\n- Reinicia el navegador e intenta de nuevo')
        } else {
          alert(`Error al acceder a la cámara: ${err.message || 'Error desconocido'}\n\nVerifica los permisos y que la cámara esté disponible.\n\nDetalles técnicos: ${err.name}`)
        }
      }
    }

    const cleanup = async () => {
      if (scannerRef.current) {
        console.log('ðŸ§¹ Limpiando escáner en cleanup...')
        try {
          await scannerRef.current.stop()
          scannerRef.current.clear()
        } catch (e) {
          console.error('Error en cleanup:', e)
        }
        scannerRef.current = null
      }
    }

    if (scannerActive) {
      initializeScanner()
    } else {
      // Si scannerActive es false, detener el escáner
      cleanup()
    }

    return () => {
      isMounted = false
      cleanup()
    }
  }, [scannerActive])

  // Limpiar escáner al desmontar el componente
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignorar errores al limpiar
        })
      }
      // Los timeouts NO se limpian aquí para evitar cancelar el auto-focus
      // durante re-renders. Se limpian solo cuando se crean nuevos timeouts.
    }
  }, [])


  return (
    <div className="attendance-management">
      {/* Animaciones */}
      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(0.6); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes checkAnimation {
            0% { 
              transform: scale(0) rotate(-45deg);
              opacity: 0;
            }
            50% { 
              transform: scale(1.2) rotate(-45deg);
              opacity: 1;
            }
            100% { 
              transform: scale(1) rotate(-45deg);
              opacity: 1;
            }
          }
          .pop-in { animation: popIn 450ms ease-out both; }
          .hover-bg:hover { background: #f8f9fa; }
          .check-animation {
            animation: checkAnimation 0.6s ease-out both;
          }
        `}
      </style>
      {/* Resumen de la Sesión y Estadísticas */}
      <Row className="mb-4">
        <Col xs={12}>
          <ComponentContainerCard
            id="session-summary"
            title={`Sesión: ${sessionName}`}
            description={`Fecha: ${sessionDate}  |  Hora: ${startTime} - ${endTime}`}
          >
            <Row className="align-items-center">
              <Col md={12} className="mb-2">
                <Row className="text-center">
                  <Col sm={4}><h5 className="mb-0 text-primary">{registrations.length}</h5><small className="text-muted">Inscritos</small></Col>
                  <Col sm={4}><h5 className="mb-0 text-success">{localAttendances.length}</h5><small className="text-muted">Asistieron</small></Col>
                  <Col sm={4}><h5 className="mb-0 text-warning">{registrations.length - localAttendances.length}</h5><small className="text-muted">Faltaron</small></Col>
                </Row>
              </Col>
            </Row>
          </ComponentContainerCard>
        </Col>
      </Row>

      {/* Lado a lado: Escaner QR (izquierda), Última asistencia (derecha) */}
      <Row>
        {/* Panel de Escaneo QR */}
        <Col lg={6} className="mb-4 mb-lg-0">
          <ComponentContainerCard
            id="qr-scanner"
            title="Escáner QR"
            description="Registrar asistencia mediante código QR"
          >
            <Card>
              <CardHeader>
                <h5 className="mb-0">
                  <i className="ri-qr-scan-line me-2"></i>
                  Registro de Asistencia
                </h5>
              </CardHeader>
              <CardBody>
                <Form onSubmit={(e) => { e.preventDefault() }} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label>Código QR del Participante</Form.Label>

                    {/* Botón para activar/desactivar cámara */}
                    <div className="mb-3">
                      <Button
                        type="button"
                        variant={scannerActive ? "danger" : "outline-primary"}
                        size="sm"
                        onClick={scannerActive ? stopScanner : startScanner}
                        disabled={checkingIn}
                        className="w-100"
                        style={{
                          borderWidth: scannerActive ? '2px' : '2px',
                          fontWeight: '600'
                        }}
                      >
                        <i className={`ri-camera-${scannerActive ? 'off' : 'line'} me-2`}></i>
                        {scannerActive ? 'Detener Cámara' : 'Activar Cámara para Escanear QR'}
                      </Button>
                    </div>

                    {/* Contenedor para el escáner de cámara */}
                    <div className="mb-3" style={{ position: 'relative', width: '100%' }}>
                      {/* Contenedor del escáner */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '500px',
                          minHeight: scannerActive ? '300px' : '0',
                          height: scannerActive ? 'auto' : '0',
                          margin: '0 auto',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: scannerActive ? '2px solid #0a192f' : 'none',
                          backgroundColor: '#000',
                          display: scannerActive ? 'block' : 'none',
                          opacity: scannerActive ? 1 : 0,
                          transition: 'opacity 0.3s ease',
                          position: 'relative'
                        }}
                      >
                        {/* El qr-reader debe estar aquí para que html5-qrcode funcione */}
                        <div id="qr-reader" style={{ width: '100%', height: '100%', minHeight: '300px' }}></div>
                      </div>

                      {scannerActive && (
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            <i className="ri-information-line me-1"></i>
                            Apunta la cámara hacia el código QR del participante
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Input manual (siempre visible) */}
                    <Form.Control
                      ref={inputRef}
                      type="text"
                      placeholder={scannerActive ? "O ingrese el código manualmente..." : "Escanee con cámara o ingrese el código QR..."}
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={checkingIn || scannerActive}
                      style={{ marginTop: scannerActive ? '0' : '0' }}
                      autoFocus
                    />
                    <Form.Text className="text-muted">
                      {scannerActive
                        ? 'La cámara escaneará automáticamente. O ingrese el código manualmente si prefiere.'
                        : 'Use la cámara para escanear o ingrese manualmente el código'}
                    </Form.Text>
                    {checkingIn && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center text-primary">
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Procesando...</span>
                          </div>
                          <small>Procesando código QR y registrando asistencia...</small>
                        </div>
                      </div>
                    )}
                  </Form.Group>

                  {/* Campo de notas eliminado */}

                  <Button
                    type="button"
                    variant="wine"
                    onClick={handleCheckIn}
                    disabled={checkingIn || !qrCode.trim() || scannerActive}
                    className="w-100"
                    style={{
                      background: scannerActive ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' : 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                      border: 'none',
                      color: '#ffffff'
                    }}
                  >
                    {checkingIn ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line me-2"></i>
                        Registrar Asistencia
                      </>
                    )}
                  </Button>
                  {scannerActive && (
                    <div className="mt-2 text-center">
                      <small className="text-muted">
                        <i className="ri-information-line me-1"></i>
                        El botón de registro está deshabilitado mientras la cámara está activa
                      </small>
                    </div>
                  )}
                </Form>
              </CardBody>
            </Card>
          </ComponentContainerCard>
        </Col>

        {/* Card SIEMPRE visible con el el último attendance de la sesión (derecha) */}
        <Col lg={6}>
          <LastAttendanceCard 
            participant={lastAttendanceParticipant} 
            loading={false}
            formatDate12h={formatDate12h}
          />
        </Col>
      </Row>

      {showSuccessCard && scannedParticipant && (
        <Row className="mt-3">
          <Col xs={12}>
            <ComponentContainerCard
              id="success-card"
              title="âœ… Asistencia Registrada"
              description="Participante registrado exitosamente"
            >
              <Card className={checkStatus === 'created' ? 'border-success' : checkStatus === 'already' ? 'border-warning' : 'border-danger'}>
                <CardHeader className={(checkStatus === 'created' ? 'bg-success text-white' : checkStatus === 'already' ? 'bg-warning text-dark' : 'bg-danger text-white')}>
                  <h5 className="mb-0">
                    <i className={(checkStatus === 'created' ? 'ri-check-line' : checkStatus === 'already' ? 'ri-information-line' : 'ri-error-warning-line') + ' me-2 pop-in'}></i>
                    {checkStatus === 'created' ? '¡Asistencia Registrada Exitosamente!' : checkStatus === 'already' ? 'Este participante ya estaba registrado' : 'No se pudo registrar la asistencia'}
                  </h5>
                </CardHeader>
                <CardBody className="p-4">
                  <div className="text-center mb-4">
                    <div
                      className="rounded-circle mx-auto d-flex align-items-center justify-content-center pop-in"
                      style={{
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        width: '80px',
                        height: '80px',
                        boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {scannedParticipant.participant.first_name?.[0]?.toUpperCase() || ''}
                      {scannedParticipant.participant.last_name?.[0]?.toUpperCase() || ''}
                    </div>
                  </div>

                  <div className="row text-center mb-4">
                    <div className="col-12">
                      <h4 className="text-success mb-2">
                        {scannedParticipant.participant.first_name} {scannedParticipant.participant.last_name}
                      </h4>
                      <p className="text-muted mb-3">{scannedParticipant.participant.email}</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="text-center">
                        <div className="mb-2">
                          <i className="ri-phone-line text-primary fs-4"></i>
                        </div>
                        <small className="text-muted d-block">Teléfono</small>
                        <strong>{scannedParticipant.participant.phone}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center">
                        <div className="mb-2">
                          <i className="ri-user-line text-info fs-4"></i>
                        </div>
                        <small className="text-muted d-block">Tipo</small>
                        <div>{getParticipantTypeBadge(scannedParticipant.participant.type)}</div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="row">
                    <div className="col-6">
                      <div className="text-center">
                        <div className="mb-2">
                          <i className="ri-calendar-check-line text-success fs-4"></i>
                        </div>
                        <small className="text-muted d-block">Código QR</small>
                        <code className="small">{scannedParticipant.registration_code}</code>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center">
                        <div className="mb-2">
                          <i className="ri-time-line text-warning fs-4"></i>
                        </div>
                        <small className="text-muted d-block">Hora de Registro</small>
                        <strong>{formatDate12h(scannedParticipant.checked_in_at || new Date().toISOString())}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <div className="alert alert-success mb-0">
                      <i className="ri-checkbox-circle-line me-2"></i>
                      <strong>¡Participante registrado exitosamente en la sesión!</strong>
                    </div>
                    <div className="mt-2">
                      <Button variant="outline-success" size="sm" onClick={() => setShowSuccessCard(false)}>
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </ComponentContainerCard>
          </Col>
        </Row>
      )}

      {/* Lista de Participantes */}
      <Row className="mt-4">
        <Col xs={12}>
          <ComponentContainerCard
            id="participants-list"
            title="Lista de Participantes"
            description="Participantes registrados en el evento"
          >
            <Card>
              <CardHeader style={{
                background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                borderBottom: 'none'
              }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0" style={{ color: '#ffffff', fontWeight: '700' }}>
                      <i className="ri-user-line me-2"></i>
                      Participantes Registrados
                    </h5>
                    <Badge bg="warning" text="dark" className="fs-6">
                      {filteredRegistrations.length} Total
                    </Badge>
                  </div>

                  <div className="d-flex align-items-center" style={{ minWidth: '300px' }}>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="ri-search-line text-muted"></i>
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Buscar por nombre, email o documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-start-0 ps-0"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {registrationsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando participantes...</p>
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <i className="ri-information-line me-2"></i>
                    {searchTerm ? 'No se encontraron participantes con esa búsqueda' : 'No hay participantes registrados en este evento'}
                  </Alert>
                ) : (
                  <>
                    {/* Tabla con scroll */}
                    <div
                      className="table-responsive"
                      style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}
                    >
                      <Table hover className="mb-0 table-dark-header">
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0a192f', zIndex: 10 }}>
                          <tr>
                            <th style={{ color: '#ffffff' }}>Participante</th>
                            <th style={{ color: '#ffffff' }}>Tipo</th>
                            <th style={{ color: '#ffffff' }}>Email</th>
                            <th style={{ color: '#ffffff' }}>Teléfono</th>
                            <th style={{ color: '#ffffff' }}>Código QR</th>
                            <th style={{ color: '#ffffff' }}>Estado</th>
                            <th style={{ color: '#ffffff' }}>Asistencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRegistrations.map((registration) => {
                            // Verificar si el participante asistió específicamente a esta sesión
                            const hasAttendedThisSession = localAttendances.some(att =>
                              att.registration.participant.id === registration.participant.id
                            )
                            return (
                              <tr key={registration.id}>
                                <td>
                                  <div>
                                    <strong>{registration.participant.first_name} {registration.participant.last_name}</strong>
                                    {registration.participant.career && (
                                      <div className="text-muted small">{registration.participant.career}</div>
                                    )}
                                  </div>
                                </td>
                                <td>{getParticipantTypeBadge(registration.participant.type)}</td>
                                <td>{registration.participant.email}</td>
                                <td>{registration.participant.phone}</td>
                                <td>
                                  <span className="badge bg-secondary" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                    {registration.registration_code || 'N/A'}
                                  </span>
                                </td>
                                <td>{getStatusBadge(registration.status)}</td>
                                <td>
                                  {hasAttendedThisSession ? (
                                    <Badge bg="success">
                                      <i className="ri-check-line me-1"></i>
                                      Presente
                                    </Badge>
                                  ) : (
                                    <Badge bg="warning">
                                      <i className="ri-time-line me-1"></i>
                                      Pendiente
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    </div>


                    {/* Paginación */}
                    <div className="mt-3 d-flex flex-column gap-3">
                      {/* Info */}
                      <div className="text-center">
                        <small className="text-muted">
                          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredRegistrations.length)} de {filteredRegistrations.length} participantes
                        </small>
                      </div>

                      {/* Controles decontroles de la paginación */}
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
          </ComponentContainerCard>
        </Col>
      </Row>
    </div>
  )
}

export default AttendanceManagement
