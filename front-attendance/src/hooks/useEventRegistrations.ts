import { useState, useCallback } from 'react'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

export interface RegisteredParticipant {
  id: string
  participant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    identification_number: string
    type: string
    career?: string
  }
  registration_code: string
  status: string
  registered_at: string
  notes: string
}

export interface UseEventRegistrationsReturn {
  registrations: RegisteredParticipant[]
  loading: boolean
  error: string | null
  fetchRegistrations: (eventId: string) => Promise<void>
  refreshRegistrations: () => Promise<void>
}

export function useEventRegistrations(eventId?: string): UseEventRegistrationsReturn {
  const [registrations, setRegistrations] = useState<RegisteredParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotificationContext()

  const fetchRegistrations = useCallback(async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await httpClient.get(`/registrations/?event=${eventId}&page_size=10000`)
      const registrationsData = response.data.results || response.data
      setRegistrations(registrationsData)

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar inscripciones'
      setError(errorMessage)
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const refreshRegistrations = useCallback(async () => {
    if (eventId) {
      await fetchRegistrations(eventId)
    }
  }, [eventId, fetchRegistrations])

  return {
    registrations,
    loading,
    error,
    fetchRegistrations,
    refreshRegistrations
  }
}
