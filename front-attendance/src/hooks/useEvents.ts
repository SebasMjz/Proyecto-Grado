import { useState, useEffect, useCallback } from 'react'
import httpClient from '@/helpers/httpClient'
import { Event, CreateEventData, UpdateEventData, EventCard, eventToEventCard } from '@/types/events'
import { useNotificationContext } from '@/context/useNotificationContext'

export interface UseEventsReturn {
  events: EventCard[]
  loading: boolean
  error: string | null
  createEvent: (eventData: CreateEventData) => Promise<boolean>
  updateEvent: (eventData: UpdateEventData) => Promise<boolean>
  deleteEvent: (eventId: string) => Promise<boolean>
  refreshEvents: () => Promise<void>
  getEvent: (eventId: string) => Promise<Event | null>
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<EventCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotificationContext()

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await httpClient.get('/events/')
      const backendEvents: Event[] = response.data.results || response.data

      // Obtener inscripciones y sesiones para cada evento
      const eventCards = await Promise.all(
        backendEvents.map(async (event) => {
          try {
            // Obtener inscripciones
            const registrationsResponse = await httpClient.get(`/registrations/?event=${event.id}`)
            const registrations = registrationsResponse.data.results || registrationsResponse.data
            const confirmedRegistrations = registrations.filter((reg: any) => reg.status === 'Confirmado')

            // Obtener sesiones para calcular horas
            let startTime = '09:00'
            let endTime = '17:00'
            try {
              const sessionsResponse = await httpClient.getEventSessions(event.id)
              const sessions = sessionsResponse.data.results || sessionsResponse.data

              if (sessions && sessions.length > 0) {
                // Ordenar sesiones por fecha y hora
                const sortedSessions = sessions.sort((a: any, b: any) => {
                  const dateA = new Date(`${a.session_date}T${a.start_time}`)
                  const dateB = new Date(`${b.session_date}T${b.start_time}`)
                  return dateA.getTime() - dateB.getTime()
                })

                // Primera sesión para hora de inicio
                startTime = sortedSessions[0].start_time.substring(0, 5) // HH:MM

                // Última sesión para hora de fin
                const lastSession = sortedSessions[sortedSessions.length - 1]
                endTime = lastSession.end_time.substring(0, 5) // HH:MM
              }
            } catch (sessionErr) {
              // Si falla la carga de sesiones, usar valores por defecto
              console.warn(`No se pudieron cargar sesiones para evento ${event.id}`)
            }

            const eventCard = eventToEventCard(event)
            eventCard.currentParticipants = confirmedRegistrations.length
            eventCard.startTime = startTime
            eventCard.endTime = endTime
            return eventCard
          } catch (err) {
            // Silently handle registration fetch errors - not critical
            const eventCard = eventToEventCard(event)
            eventCard.currentParticipants = 0
            return eventCard
          }
        })
      )

      setEvents(eventCards)

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar eventos'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: CreateEventData): Promise<boolean> => {
    try {
      setLoading(true)

      const response = await httpClient.createEvent(eventData)
      const newEvent: Event = response.data

      // Agregar el nuevo evento a la lista
      const newEventCard = eventToEventCard(newEvent)
      setEvents(prev => [newEventCard, ...prev])

      showNotification({
        message: 'Evento creado exitosamente',
        variant: 'success'
      })

      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al crear evento'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateEvent = async (eventData: UpdateEventData): Promise<boolean> => {
    try {
      setLoading(true)

      const { id, ...updateData } = eventData
      const response = await httpClient.updateEvent(id, updateData)
      const updatedEvent: Event = response.data

      // Actualizar el evento en la lista
      const updatedEventCard = eventToEventCard(updatedEvent)
      setEvents(prev =>
        prev.map(event =>
          event.id === id ? updatedEventCard : event
        )
      )

      showNotification({
        message: 'Evento actualizado exitosamente',
        variant: 'success'
      })

      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al actualizar evento'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      setLoading(true)

      await httpClient.deleteEvent(eventId)

      // Remover el evento de la lista
      setEvents(prev => prev.filter(event => event.id !== eventId))

      showNotification({
        message: 'Evento eliminado exitosamente',
        variant: 'success'
      })

      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al eliminar evento'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    await fetchEvents()
  }

  const getEvent = useCallback(async (eventId: string): Promise<Event | null> => {
    try {
      const response = await httpClient.getEvent(eventId)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar evento'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return null
    }
  }, [showNotification])

  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    getEvent
  }
}
