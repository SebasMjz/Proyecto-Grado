import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import SplashScreen from './components/SplashScreen'

import '@/assets/scss/app.scss'

function App() {
  return (
    <>
      <SplashScreen />
      <AppProvidersWrapper>
        <AppRouter />
      </AppProvidersWrapper>
    </>
  )
}

export default App
