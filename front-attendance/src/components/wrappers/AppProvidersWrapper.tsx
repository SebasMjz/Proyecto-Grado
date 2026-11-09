import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import { AuthProvider } from '@/context/useAuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { TitleProvider } from '@/context/useTitleContext'
import { Web3Provider } from '@/context/Web3Context'
import { ChildrenType } from '@/types/component-props'
import { useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { ToastContainer } from 'react-toastify'

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  const handleChangeTitle = () => {
    if (document.visibilityState == 'hidden') document.title = 'Sistema de Control de Eventos'
    else document.title = DEFAULT_PAGE_TITLE
  }

  useEffect(() => {
    if (document) {
      const e = document.querySelector<HTMLDivElement>('#__next_splash')
      if (e?.hasChildNodes()) {
        document.querySelector('#splash-screen')?.classList.add('remove')
      }
      e?.addEventListener('DOMNodeInserted', () => {
        document.querySelector('#splash-screen')?.classList.add('remove')
      })
    }

    document.addEventListener('visibilitychange', handleChangeTitle)
    return () => {
      document.removeEventListener('visibilitychange', handleChangeTitle)
    }
  }, [])

  return (
    <HelmetProvider>
      <AuthProvider>
        <LayoutProvider>
          <TitleProvider>
            <NotificationProvider>
              <Web3Provider>
                {children}
                <ToastContainer theme="colored" />
              </Web3Provider>
            </NotificationProvider>
          </TitleProvider>
        </LayoutProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}
export default AppProvidersWrapper
