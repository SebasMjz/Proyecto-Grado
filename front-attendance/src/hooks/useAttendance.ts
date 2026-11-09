import { useState, useCallback } from 'react'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

export interface AttendanceRecord {
  id: string
  registration: {
    id: string
    participant: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone: string
      type: string
      career?: string
    }
    registration_code: string
    status: string
  }
  session: {
    id: string
    session_name: string
    session_date: string
    start_time: string
    end_time: string
  }
  checked_in_at: string
  checked_in_by?: {
    id: string
    first_name: string
    last_name: string
  }
  location: string
  notes: string
}

export interface CheckInData {
  registration_code: string
  session_id: string
  location?: string
  notes?: string
}

export interface UseAttendanceReturn {
  attendances: AttendanceRecord[]
  loading: boolean
  error: string | null
  checkIn: (data: CheckInData) => Promise<{ success: boolean; message: string; attendance?: AttendanceRecord }>
  fetchAttendances: (sessionId: string) => Promise<void>
  refreshAttendances: () => Promise<void>
}

export function useAttendance(sessionId?: string): UseAttendanceReturn {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotificationContext()

  const fetchAttendances = useCallback(async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await httpClient.get(`/attendances/?session=${sessionId}&page_size=10000`)
      const attendancesData = response.data.results || response.data
      setAttendances(attendancesData)

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar asistencias'
      setError(errorMessage)
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const checkIn = useCallback(async (data: CheckInData): Promise<{ success: boolean; message: string; attendance?: AttendanceRecord }> => {
    try {
      const response = await httpClient.post('/attendances/checkin/', data)
      const result = response.data

      if (result.created) {
        const participantName = result.attendance?.registration?.participant
          ? `${result.attendance.registration.participant.first_name} ${result.attendance.registration.participant.last_name}`
          : 'Participante'

        showNotification({
          message: `✓ ${participantName} registrado exitosamente`,
          variant: 'success'
        })

        return {
          success: true,
          message: result.message,
          attendance: result.attendance
        }
      } else {
        showNotification({
          message: result.message || 'El participante ya estaba registrado',
          variant: 'warning'
        })

        return {
          success: false,
          message: result.message || 'El participante ya estaba registrado'
        }
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al registrar asistencia'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })

      return {
        success: false,
        message: errorMessage
      }
    }
  }, [showNotification])

  const refreshAttendances = useCallback(async () => {
    if (sessionId) {
      await fetchAttendances(sessionId)
    }
  }, [sessionId, fetchAttendances])

  return {
    attendances,
    loading,
    error,
    checkIn,
    fetchAttendances,
    refreshAttendances
  }
}
