import { EventClickArg, EventInput } from '@fullcalendar/core'
import { DateClickArg, Draggable } from '@fullcalendar/interaction'
import { useEffect, useState } from 'react'
import { useEvents } from '@/hooks/useEvents'
import httpClient from '@/helpers/httpClient'

export type SubmitEventType = {
  title: string
  category: string
}

const useCalendar = () => {
  const [show, setShow] = useState<boolean>(false)
  const { events: backendEvents } = useEvents()

  const onOpenModal = () => setShow(true)
  const [isEditable, setIsEditable] = useState<boolean>(false)
  const [events, setEvents] = useState<EventInput[]>([])
  const [eventData, setEventData] = useState<EventInput>()

  // Convertir eventos y sesiones del backend al formato del calendario
  useEffect(() => {
    if (backendEvents && backendEvents.length > 0) {
      const calendarEvents: EventInput[] = []

      // Agregar eventos principales
      backendEvents.forEach(event => {
        // Usar start_date y end_date si están disponibles, sino usar date
        const startDateStr = event.start_date || event.date
        const endDateStr = event.end_date || event.date

        if (!startDateStr) return // Skip si no hay fecha de inicio

        const startDate = new Date(startDateStr)
        const endDate = new Date(endDateStr)

        // Calcular si el evento dura múltiples días
        const isMultiDay = startDate.toDateString() !== endDate.toDateString()

        // Para eventos multi-día, FullCalendar necesita que la fecha de fin sea el día DESPUÉS del último día
        // Por ejemplo, si el evento es del 1 al 3, end debe ser 4
        let calendarEndDate = new Date(endDate)
        if (isMultiDay) {
          calendarEndDate.setDate(calendarEndDate.getDate() + 1)
        }

        // Determinar color según el estado
        let backgroundColor = '#0a192f' // Color principal (vino/magenta)
        let borderColor = '#0a192f'
        let textColor = '#ffffff'

        const eventStatus = event.original_status || event.status

        if (eventStatus === 'Completado' || eventStatus === 'completed') {
          backgroundColor = '#28a745' // Verde para completados
          borderColor = '#28a745'
        } else if (eventStatus === 'Cancelado') {
          backgroundColor = '#dc3545' // Rojo para cancelados
          borderColor = '#dc3545'
        } else if (eventStatus === 'Borrador') {
          backgroundColor = '#6c757d' // Gris para borradores
          borderColor = '#6c757d'
        } else if (eventStatus === 'upcoming') {
          backgroundColor = '#ffc107' // Amarillo para próximos
          borderColor = '#ffc107'
          textColor = '#000000'
        }

        calendarEvents.push({
          id: `event-${event.id}`,
          title: `📌 ${event.name}`,
          start: startDateStr,
          end: isMultiDay ? calendarEndDate.toISOString().split('T')[0] : undefined,
          allDay: true, // Los eventos principales son siempre "all day"
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          textColor: textColor,
          className: 'event-main',
          extendedProps: {
            type: 'event',
            description: event.description,
            location: event.location,
            status: eventStatus,
            isMultiDay: isMultiDay,
            duration: isMultiDay ?
              Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1
          }
        })
      })

      setEvents(calendarEvents)
    }
  }, [backendEvents])

  // Función para cargar sesiones de un evento específico
  const loadEventSessions = async (eventId: string) => {
    try {
      const response = await httpClient.getEventSessions(eventId)
      const sessions = response.data.results || response.data

      if (sessions && sessions.length > 0) {
        const sessionEvents: EventInput[] = sessions.map((session: any) => ({
          id: `session-${session.id}`,
          title: `⏱️ ${session.session_name || 'Sesión'}`,
          start: `${session.session_date}T${session.start_time}`,
          end: `${session.session_date}T${session.end_time}`,
          backgroundColor: '#17a2b8', // Color cyan/turquesa para sesiones
          borderColor: '#17a2b8',
          textColor: '#ffffff',
          className: 'event-session',
          extendedProps: {
            type: 'session',
            eventId: eventId,
            sessionName: session.session_name,
            startTime: session.start_time,
            endTime: session.end_time
          }
        }))

        setEvents(prev => [...prev, ...sessionEvents])
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error)
    }
  }

  // Cargar sesiones para todos los eventos
  useEffect(() => {
    if (backendEvents && backendEvents.length > 0) {
      backendEvents.forEach(event => {
        loadEventSessions(event.id)
      })
    }
  }, [backendEvents])

  const onCloseModal = () => {
    setEventData(undefined)
    setShow(false)
  }

  useEffect(() => {
    // create draggable events
    const draggableEl = document.getElementById('external-events')
    if (draggableEl) {
      new Draggable(draggableEl, {
        itemSelector: '.external-event',
      })
    }
  }, [])

  const onDateClick = (arg: DateClickArg) => {
    // Solo lectura - no abrir modal
    console.log('Fecha clickeada:', arg.dateStr)
  }

  const onEventClick = (arg: EventClickArg) => {
    // Solo lectura - mostrar información del evento/sesión
    const event = {
      id: String(arg.event.id),
      title: arg.event.title,
      className: arg.event.classNames[0],
    }
    setEventData(event)
    setIsEditable(false) // Siempre false para solo lectura
    onOpenModal()
  }

  const onDrop = () => {
    // Solo lectura - no permitir drag & drop
    console.log('Drag & drop deshabilitado - modo solo lectura')
  }

  const onAddEvent = () => {
    // Solo lectura - no permitir agregar eventos
    console.log('Creación de eventos deshabilitada - modo solo lectura')
    onCloseModal()
  }

  const onUpdateEvent = () => {
    // Solo lectura - no permitir editar eventos
    console.log('Edición de eventos deshabilitada - modo solo lectura')
    onCloseModal()
  }

  const onRemoveEvent = () => {
    // Solo lectura - no permitir eliminar eventos
    console.log('Eliminación de eventos deshabilitada - modo solo lectura')
    onCloseModal()
  }

  const onEventDrop = () => {
    // Solo lectura - no permitir mover eventos
    console.log('Movimiento de eventos deshabilitado - modo solo lectura')
  }

  const createNewEvent = () => {
    // Solo lectura - no permitir crear eventos
    console.log('Creación de eventos deshabilitada - modo solo lectura')
  }

  return {
    createNewEvent,
    show,
    onDateClick,
    onEventClick,
    onDrop,
    onEventDrop,
    events,
    onCloseModal,
    isEditable,
    eventData,
    onUpdateEvent,
    onRemoveEvent,
    onAddEvent,
  }
}

export default useCalendar
