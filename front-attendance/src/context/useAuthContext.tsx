import type { UserType } from '@/types/auth'
import { createContext, useContext, useState, useEffect } from 'react'
import type { ChildrenType } from '../types/component-props'
import { useNavigate } from 'react-router-dom'
import httpClient from '@/helpers/httpClient'

export type AuthContextType = {
  user: UserType | undefined
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; userType?: UserType['user_type']; error?: string }>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: ChildrenType) {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserType | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  // Confirmar la sesión y el rol con el backend al abrir la aplicación.
  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      try {
        let accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        if (!accessToken && refreshToken) {
          const response = await httpClient.refreshToken(refreshToken)
          accessToken = response.data.access
          if (accessToken) localStorage.setItem('access_token', accessToken)
        }
        if (!accessToken) {
          if (mounted) setUser(undefined)
          return
        }

        const response = await httpClient.get<UserType>('/me/')
        if (mounted) {
          setUser(response.data)
          localStorage.setItem('user_data', JSON.stringify(response.data))
        }
      } catch (error) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_data')
        if (mounted) setUser(undefined)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void checkAuth()
    return () => { mounted = false }
  }, [])
  const login = async (email: string, password: string): Promise<{ success: boolean; userType?: UserType['user_type']; error?: string }> => {
    try {
      const response = await httpClient.login(email, password)
      const { token, refresh, user: userData } = response.data

      // Guardar tokens en localStorage
      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', refresh)

      // Convertir la respuesta del backend al formato esperado por el frontend
      const formattedUser = {
        id: userData.id || '',
        email: userData.email,
        first_name: userData.name?.split(' ')[0] || '',
        last_name: userData.name?.split(' ').slice(1).join(' ') || '',
        user_type: userData.user_type,
        phone: '',
        is_active: true,
        is_staff: userData.is_staff ?? userData.user_type !== 'member',
        date_joined: new Date().toISOString()
      }

      // Guardar información del usuario en localStorage
      localStorage.setItem('user_data', JSON.stringify(formattedUser))

      // Guardar información del usuario en el estado
      setUser(formattedUser)

      return { success: true, userType: userData.user_type }
    } catch (error: any) {
      const responseData = error.response?.data
      const errorMessage = responseData?.detail || responseData?.error || responseData?.non_field_errors?.[0] || 'Error al iniciar sesión'
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      // Llamar al endpoint de logout del backend
      await httpClient.logout()
    } catch (error) {
      // Silent error handling
    } finally {
      // Limpiar tokens y estado local
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      setUser(undefined)
      navigate('/auth/sign-in')
    }
  }

  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      setUser(undefined)
      return
    }

    try {
      const response = await httpClient.refreshToken(refreshToken)
      const { access } = response.data
      localStorage.setItem('access_token', access)

      // Obtener información del usuario desde localStorage
      const userData = localStorage.getItem('user_data')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      // Si el refresh falla, limpiar tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      setUser(undefined)
      navigate('/auth/sign-in')
    }
  }

  const isAuthenticated = !!user && !!localStorage.getItem('access_token')

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}>
      {children}
    </AuthContext.Provider>
  )
}
