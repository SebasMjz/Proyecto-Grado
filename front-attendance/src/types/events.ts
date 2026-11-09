// Tipos para eventos basados en el backend Django

export interface Event {
  id: string
  title: string
  description: string
  location: string
  capacity?: number
  status: 'Borrador' | 'Publicado' | 'Cancelado' | 'Completado'
  registration_deadline?: string
  start_date: string
  end_date: string
  requires_attendance_for_certificate: boolean
  minimum_attendance_percentage: number
  created_at: string
  created_by?: {
    id: string
    name: string
    email: string
  }
  created_by_id?: string
}

export interface EventSession {
  id: string
  event?: Event
  event_id: string
  session_date: string
  start_time: string
  end_time: string
  session_name?: string
  created_at: string
}

export interface CreateEventData {
  title: string
  description: string
  location: string
  capacity?: number
  status?: 'Borrador' | 'Publicado' | 'Cancelado' | 'Completado'
  registration_deadline?: string
  start_date: string
  end_date: string
  requires_attendance_for_certificate?: boolean
  minimum_attendance_percentage?: number
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string
}

export interface CreateEventSessionData {
  event_id: string
  session_date: string
  start_time: string
  end_time: string
  session_name?: string
}

// Tipos para el frontend (compatibilidad con datos hardcodeados existentes)
export interface EventCard {
  id: string
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  status: 'active' | 'upcoming' | 'completed'
  maxParticipants: number
  currentParticipants: number
  requirements?: string
  image?: string
  attendanceChecks: number
  // Campos originales del Event para lógica de multi-día
  start_date?: string
  end_date?: string
  original_status?: 'Borrador' | 'Publicado' | 'Cancelado' | 'Completado'
}

// Función para convertir Event del backend a EventCard del frontend
export function eventToEventCard(event: Event): EventCard {
return {
    id: event.id,
    name: event.title,
    description: event.description,
    date: event.start_date,
    startTime: '09:00', // Por defecto, se puede mejorar
    endTime: '17:00',   // Por defecto, se puede mejorar
    location: event.location,
    status: event.status === 'Publicado' ? 'active' : 
            event.status === 'Borrador' ? 'upcoming' : 
            event.status === 'Completado' ? 'completed' : 'upcoming',
    maxParticipants: event.capacity || 0,
    currentParticipants: 0, // Se calculará desde las inscripciones
    requirements: event.requires_attendance_for_certificate ? 
    `Requiere ${event.minimum_attendance_percentage}% de asistencia` : undefined,
    image: undefined, // Se puede agregar campo de imagen al backend
    attendanceChecks: 1, // Por defecto, se puede calcular desde las sesiones
    // Guardar campos originales para lógica de multi-día y estado
    start_date: event.start_date,
    end_date: event.end_date,
    original_status: event.status
  }
}
