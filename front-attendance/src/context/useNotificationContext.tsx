import { createContext, useContext, useState, useCallback } from 'react'
import { ToastBody, ToastHeader } from 'react-bootstrap'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'

import type { BootstrapVariantType, ChildrenType } from '@/types/component-props'

type ShowNotificationType = {
  title?: string
  message: string
  variant?: BootstrapVariantType
  delay?: number
}

type ToastrProps = {
  show: boolean
  onClose?: () => void
} & ShowNotificationType

type NotificationContextType = {
  showNotification: ({ title, message, variant }: ShowNotificationType) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function Toastr({ show, title, message, onClose, variant = 'light', delay }: Readonly<ToastrProps>) {
  // Mapear variantes a colores más visibles
  const getVariantStyles = (v: string) => {
    switch (v) {
      case 'success':
        return { bg: '#28a745', text: 'white', headerBg: '#218838' }
      case 'danger':
        return { bg: '#dc3545', text: 'white', headerBg: '#c82333' }
      case 'warning':
        return { bg: '#ffc107', text: '#212529', headerBg: '#e0a800' }
      case 'info':
        return { bg: '#17a2b8', text: 'white', headerBg: '#138496' }
      case 'primary':
        return { bg: '#ffc107', text: 'white', headerBg: '#112240' }
      case 'light':
      default:
        return { bg: '#ffc107', text: 'white', headerBg: '#112240' } // Usar color VRIS por defecto
    }
  }

  const styles = getVariantStyles(variant)
  
  return (
    <ToastContainer className="m-3 position-fixed" position="top-end" style={{ zIndex: 9999 }}>
      <Toast 
        delay={delay} 
        show={show} 
        onClose={onClose} 
        autohide
        style={{
          backgroundColor: styles.bg,
          color: styles.text,
          border: `1px solid ${styles.headerBg}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        {title && (
          <ToastHeader 
            style={{
              backgroundColor: styles.headerBg,
              color: styles.text,
              borderBottom: `1px solid ${styles.headerBg}`
            }}
          >
            <strong className="me-auto">{title}</strong>
          </ToastHeader>
        )}
        <ToastBody 
          style={{
            backgroundColor: styles.bg,
            color: styles.text
          }}
        >
          {message}
        </ToastBody>
      </Toast>
    </ToastContainer>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within an NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: ChildrenType) {
  const defaultConfig = {
    show: false,
    message: '',
    title: '',
    delay: 2000,
  }

  const [config, setConfig] = useState<ToastrProps>(defaultConfig)
  
  const hideNotification = useCallback(() => {
    setConfig({ show: false, message: '', title: '' })
  }, [])

  const showNotification = useCallback(({ title, message, variant, delay = 2000 }: ShowNotificationType) => {
    setConfig({
      show: true,
      title,
      message,
      variant: variant ?? 'light',
      onClose: hideNotification,
      delay,
    })

    setTimeout(() => {
      setConfig(defaultConfig)
    }, delay)
  }, [hideNotification])

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <Toastr {...config} />
      {children}
    </NotificationContext.Provider>
  )
}
