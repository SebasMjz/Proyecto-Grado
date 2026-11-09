import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { useWeb3 } from '@/context/Web3Context'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const TopNavigationBar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const { isConnected, walletAddress, setShowWalletModal, network } = useWeb3()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const formatShortAddress = (addr?: string | null) => {
    if (!addr) return 'Conectar Wallet'
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  return (
    <>
      <header
        className="topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 999,
          padding: '0.65rem 1.5rem',
          minHeight: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}
      >
        {/* Left: Brand title & breadcrumb / context */}
        <div className="d-flex align-items-center gap-3">
          <div
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: '36px',
                height: '36px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#d97706'
              }}
            >
              <IconifyIcon icon="solar:diploma-verified-bold-duotone" style={{ fontSize: '20px' }} />
            </div>
            <div>
              <div className="fw-bold lh-1" style={{ color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                Academic<span style={{ color: '#d97706' }}>SBT</span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                Certificación & Asistencia Descentralizada
              </div>
            </div>
          </div>

          {/* Network Badge */}
          <div
            className="d-none d-md-flex align-items-center gap-2 px-2.5 py-1 rounded-pill ms-2"
            style={{
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              fontSize: '0.75rem',
              color: '#065f46'
            }}
          >
            <span className="pulse-beacon"></span>
            <span className="fw-semibold font-monospace">{network || 'EVM Testnet'}</span>
          </div>
        </div>

        {/* Right: Actions, Wallet Pill, User Profile & Mobile Menu */}
        <div className="d-flex align-items-center gap-2">
          {/* Quick Nav: Certificados */}
          <button
            type="button"
            className="btn btn-sm d-none d-sm-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 fw-semibold"
            onClick={() => navigate('/certificates')}
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.82rem'
            }}
          >
            <IconifyIcon icon="solar:diploma-bold-duotone" />
            <span>Emitir SBTs</span>
          </button>

          {/* Wallet Connection Button */}
          <button
            type="button"
            onClick={() => setShowWalletModal(true)}
            className="btn btn-sm d-flex align-items-center gap-2 rounded-pill px-3.5 py-1.5 fw-semibold transition-all"
            style={{
              background: isConnected ? '#d1fae5' : '#0f172a',
              border: isConnected ? '1px solid #a7f3d0' : '1px solid #0f172a',
              color: isConnected ? '#065f46' : '#ffffff',
              fontSize: '0.84rem',
              boxShadow: isConnected ? 'none' : '0 1px 3px rgba(15, 23, 42, 0.12)'
            }}
          >
            <IconifyIcon icon="solar:wallet-bold-duotone" style={{ fontSize: '1.1rem' }} />
            <span className={isConnected ? 'font-monospace' : ''}>
              {formatShortAddress(walletAddress)}
            </span>
            {isConnected && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#059669'
                }}
              ></span>
            )}
          </button>

          {/* User Email Pill */}
          {user && (
            <div
              className="d-none d-lg-flex align-items-center gap-2 px-2.5 py-1 rounded-pill"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '0.8rem',
                color: '#334155'
              }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#0f172a',
                  fontSize: '0.72rem'
                }}
              >
                {(user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="btn btn-sm d-lg-none d-flex align-items-center justify-content-center p-2 rounded-3 text-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              fontSize: '1.25rem'
            }}
            aria-label="Abrir Menú"
          >
            <IconifyIcon icon={mobileMenuOpen ? 'solar:close-circle-bold-duotone' : 'solar:hamburger-menu-linear'} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div
          className="d-lg-none"
          style={{
            position: 'fixed',
            top: '68px',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
            padding: '1.25rem',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="d-flex flex-column gap-2">
            <div className="p-2 mb-2 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="text-muted small">Sesión activa</div>
              <div className="fw-semibold text-dark">{user?.email || 'Sin sesión'}</div>
              <div className="small mt-1 font-monospace" style={{ color: '#0284c7' }}>Red: {network}</div>
            </div>

            <button
              className="btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}
            >
              <IconifyIcon icon="solar:widget-5-bold-duotone" style={{ color: '#d97706' }} />
              <span>Panel de Control</span>
            </button>

            <button
              className="btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              onClick={() => { navigate('/events/events-list'); setMobileMenuOpen(false); }}
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}
            >
              <IconifyIcon icon="solar:calendar-bold-duotone" style={{ color: '#d97706' }} />
              <span>Eventos & Sesiones</span>
            </button>

            <button
              className="btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              onClick={() => { navigate('/certificates'); setMobileMenuOpen(false); }}
              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
            >
              <IconifyIcon icon="solar:diploma-bold-duotone" />
              <span>Certificados SBT (ERC-5192)</span>
            </button>

            <button
              className="btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              onClick={() => { navigate('/users'); setMobileMenuOpen(false); }}
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}
            >
              <IconifyIcon icon="solar:users-group-rounded-bold-duotone" style={{ color: '#d97706' }} />
              <span>Usuarios</span>
            </button>

            <button
              className="btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 rounded-3"
              onClick={() => { navigate('/apps/calendar'); setMobileMenuOpen(false); }}
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}
            >
              <IconifyIcon icon="solar:calendar-add-bold-duotone" style={{ color: '#d97706' }} />
              <span>Calendario</span>
            </button>

            <hr style={{ borderColor: '#e2e8f0', margin: '0.5rem 0' }} />

            <button
              className="btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 rounded-3 text-danger"
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              style={{ background: '#fee2e2', border: '1px solid #fecaca' }}
            >
              <IconifyIcon icon="solar:logout-2-bold-duotone" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default TopNavigationBar
