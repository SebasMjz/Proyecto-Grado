import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { basePath } from './context/constants.ts'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './assets/scss/custom/vris-colors.scss'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
