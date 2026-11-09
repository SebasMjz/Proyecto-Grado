import { useAuthContext } from '@/context/useAuthContext'
import { useWeb3 } from '@/context/Web3Context'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import WalletModal from '@/components/modals/WalletModal'

const SidebarFooter = () => {
  const { logout } = useAuthContext()
  const { isConnected, walletAddress, setShowWalletModal } = useWeb3()

  const formatShortAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  return (
    <>
      <ul className="navbar-nav" style={{ paddingBottom: '1rem', marginTop: 'auto' }}>
        <li className="nav-item">
          <a
            href="#"
            className="nav-link d-flex align-items-center"
            onClick={(e) => {
              e.preventDefault()
              setShowWalletModal(true)
            }}
          >
            <span className="nav-icon">
              <IconifyIcon icon="solar:wallet-bold-duotone" className="text-warning" />
            </span>
            <span className="nav-text text-warning font-monospace">
              {isConnected && walletAddress ? formatShortAddress(walletAddress) : 'Connect Wallet'}
            </span>
            {isConnected && (
              <span
                className="badge bg-success rounded-circle p-1 ms-auto"
                style={{ width: '8px', height: '8px' }}
                title="Wallet Conectada"
              ></span>
            )}
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault()
              logout()
            }}
          >
            <span className="nav-icon">
              <IconifyIcon icon="solar:logout-2-bold-duotone" className="text-danger" />
            </span>
            <span className="nav-text text-danger">Cerrar sesión</span>
          </a>
        </li>
      </ul>

      <WalletModal />
    </>
  )
}

export default SidebarFooter
