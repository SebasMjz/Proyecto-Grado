import { useEffect, useState } from 'react'

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className="splash-screen"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0b1220 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <i
          className="bi bi-boxes"
          style={{
            fontSize: '120px',
            color: '#ffc107',
            animation: 'pulse 2s ease-in-out infinite',
            display: 'inline-block'
          }}
        ></i>
        <div style={{
          color: '#e2e8f0',
          fontSize: '24px',
          fontWeight: 'bold',
          marginTop: '20px'
        }}>
          dApp de Asistencia
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
