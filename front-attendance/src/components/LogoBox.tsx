import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const LogoBox = () => {
  return (
    <div className="logo-box d-flex align-items-center px-3 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
      <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{
            width: '38px',
            height: '38px',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#d97706'
          }}
        >
          <IconifyIcon icon="solar:diploma-verified-bold-duotone" style={{ fontSize: '22px' }} />
        </div>
        <div className="logo-lg d-flex flex-column">
          <span className="fw-bold lh-1" style={{ color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
            Academic<span style={{ color: '#d97706' }}>SBT</span>
          </span>
          <span style={{ color: '#64748b', fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            dApp Certificados
          </span>
        </div>
      </Link>
    </div>
  )
}

export default LogoBox
