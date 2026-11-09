import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import SplashScreen from './components/SplashScreen'

import 'nouislider/dist/nouislider.css'
import 'flatpickr/dist/flatpickr.css'
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
