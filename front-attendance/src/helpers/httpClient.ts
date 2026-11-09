import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// Configuración del backend Django desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Validar que la variable de entorno esté configurada
if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL no está configurada. Por favor, crea un archivo .env con la variable VITE_API_BASE_URL'
  )
}

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token JWT a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y renovar tokens
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Si el token expiró (401) y no es una petición de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          })

          const { access } = response.data
          localStorage.setItem('access_token', access)

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${access}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Si el refresh falla, limpiar tokens y redirigir al login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Cliente HTTP con métodos mejorados
function HttpClient() {
  return {
    // Métodos básicos
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
      apiClient.get(url, config),

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
      apiClient.post(url, data, config),

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
      apiClient.put(url, data, config),

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
      apiClient.patch(url, data, config),

    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
      apiClient.delete(url, config),

    // Métodos específicos para autenticación
    login: (email: string, password: string) =>
      apiClient.post('/login/', { email, password }),

    logout: () =>
      apiClient.post('/logout/'),

    refreshToken: (refreshToken: string) =>
      apiClient.post('/token/refresh/', { refresh: refreshToken }),

    // Métodos para eventos
    getEvents: () =>
      apiClient.get('/events/'),

    getEvent: (id: string) =>
      apiClient.get(`/events/${id}/`),

    createEvent: (eventData: any) =>
      apiClient.post('/events/', eventData),

    updateEvent: (id: string, eventData: any) =>
      apiClient.put(`/events/${id}/`, eventData),

    deleteEvent: (id: string) =>
      apiClient.delete(`/events/${id}/`),

    // Métodos para participantes
    getParticipants: () =>
      apiClient.get('/participants/'),

    getParticipant: (id: string) =>
      apiClient.get(`/participants/${id}/`),

    createParticipant: (participantData: any) =>
      apiClient.post('/participants/', participantData),

    // Métodos para inscripciones
    getRegistrations: () =>
      apiClient.get('/registrations/'),

    getRegistration: (id: string) =>
      apiClient.get(`/registrations/${id}/`),

    createRegistration: (registrationData: any) =>
      apiClient.post('/registrations/', registrationData),

    // Métodos para asistencia
    checkIn: (registrationCode: string, sessionId: string, location?: string, notes?: string) =>
      apiClient.post('/attendance/check-in/', {
        registration_code: registrationCode,
        session_id: sessionId,
        location,
        notes,
      }),

    getAttendance: () =>
      apiClient.get('/attendance/'),

    // Métodos para certificados
    getCertificates: () =>
      apiClient.get('/certificates/'),

    issueCertificate: (registrationId: string) =>
      apiClient.post('/certificates/issue/', { registration_id: registrationId }),

    verifyCertificate: (certificateCode: string) =>
      apiClient.get(`/certificates/${certificateCode}/`),

    // Métodos para sesiones de eventos
    getEventSessions: (eventId: string) =>
      apiClient.get(`/sessions/?event=${eventId}`),

    createEventSession: (sessionData: any) =>
      apiClient.post('/sessions/', sessionData),
  }
}

export default HttpClient()
