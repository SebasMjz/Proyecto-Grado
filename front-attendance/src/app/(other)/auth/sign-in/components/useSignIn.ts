import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'

import { useAuthContext } from '@/context/useAuthContext'

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const { login: authLogin } = useAuthContext()
  const [searchParams] = useSearchParams()

  const loginFormSchema = yup.object({
    email: yup.string().email('Por favor ingresa un email válido').required('Por favor ingresa tu email'),
    password: yup.string().required('Por favor ingresa tu contraseña'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  type LoginFormFields = yup.InferType<typeof loginFormSchema>

  const redirectUser = (userType?: string) => {
    if (userType === 'member') {
      navigate('/my-certificates')
      return
    }
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/dashboard')
  }

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await authLogin(values.email, values.password)
      
      if (result.success) {
        redirectUser(result.userType)
      } else {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch {
      setError('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  })

  return { loading, login, control, error }
}

export default useSignIn
