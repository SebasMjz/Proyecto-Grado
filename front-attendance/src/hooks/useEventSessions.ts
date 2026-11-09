import { useState, useEffect, useCallback } from 'react'
import httpClient from '@/helpers/httpClient'
import { EventSession, CreateEventSessionData } from '@/types/events'
import { useNotificationContext } from '@/context/useNotificationContext'

export interface UseEventSessionsReturn {
  sessions: EventSession[]
  loading: boolean
  error: string | null
  createSession: (sessionData: CreateEventSessionData) => Promise<boolean>
  updateSession: (sessionId: string, sessionData: Partial<CreateEventSessionData>) => Promise<boolean>
  deleteSession: (sessionId: string) => Promise<boolean>
  refreshSessions: (eventId: string) => Promise<void>
}

export function useEventSessions(eventId?: string): UseEventSessionsReturn {
  const [sessions, setSessions] = useState<EventSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotificationContext()

  const fetchSessions = useCallback(async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)
      // Limpiar sesiones anteriores antes de cargar las nuevas
      setSessions([])

      // Usar el método específico del httpClient
      const response = await httpClient.getEventSessions(eventId)
      const sessionsData = response.data.results || response.data
      setSessions(sessionsData)

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar sesiones'
      setError(errorMessage)
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const createSession = useCallback(async (sessionData: CreateEventSessionData): Promise<boolean> => {
    try {
      setLoading(true)

      // Asegurar que la fecha se envíe en formato YYYY-MM-DD sin conversión de zona horaria
      let sessionDate = sessionData.session_date

      // Si la fecha incluye información de hora (ISO string), extraer solo la parte de la fecha
      if (sessionDate.includes('T')) {
        sessionDate = sessionDate.split('T')[0]
      }

      // El backend espera event_id como PrimaryKeyRelatedField, no como string
      const backendData = {
        event_id: sessionData.event_id,
        session_date: sessionDate, // Fecha en formato YYYY-MM-DD
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        session_name: sessionData.session_name
      }

      const response = await httpClient.createEventSession(backendData)
      const newSession: EventSession = response.data

      // Agregar la nueva sesión a la lista
      setSessions(prev => [...prev, newSession])

      showNotification({
        message: `Sesión "${sessionData.session_name || 'Principal'}" creada exitosamente`,
        variant: 'success'
      })

      return true
    } catch (err: any) {
      let errorMessage = 'No se pudo crear la sesión'

      if (err.response?.data?.non_field_errors) {
        errorMessage = 'Ya existe una sesión con la misma fecha y hora de inicio. Por favor, elige otra fecha u hora.'
      } else if (err.response?.data?.event_id) {
        errorMessage = `Error en el evento: ${err.response.data.event_id[0]}`
      } else if (err.response?.data?.session_date) {
        errorMessage = `Error en la fecha: ${err.response.data.session_date[0]}`
      } else if (err.response?.data?.start_time) {
        errorMessage = `Error en hora de inicio: ${err.response.data.start_time[0]}`
      } else if (err.response?.data?.end_time) {
        errorMessage = `Error en hora de fin: ${err.response.data.end_time[0]}`
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      }

      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const updateSession = async (sessionId: string, sessionData: Partial<CreateEventSessionData>): Promise<boolean> => {
    try {
      setLoading(true)

      const response = await httpClient.put(`/sessions/${sessionId}/`, sessionData)
      const updatedSession: EventSession = response.data

      // Actualizar la sesión en la lista
      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId ? updatedSession : session
        )
      )

      showNotification({
        message: 'Sesión actualizada exitosamente',
        variant: 'success'
      })

      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al actualizar sesión'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    try {
      setLoading(true)

      await httpClient.delete(`/event-sessions/${sessionId}/`)

      // Remover la sesión de la lista
      setSessions(prev => prev.filter(session => session.id !== sessionId))

      showNotification({
        message: 'Sesión eliminada exitosamente',
        variant: 'success'
      })

      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al eliminar sesión'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const refreshSessions = async (eventId: string) => {
    await fetchSessions(eventId)
  }

  useEffect(() => {
    if (eventId) {
      fetchSessions(eventId)
    } else {
      // Limpiar sesiones si no hay eventId
      setSessions([])
      setLoading(false)
      setError(null)
    }
  }, [eventId, fetchSessions])

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refreshSessions
  }
}
