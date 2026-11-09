import { Modal, Button } from 'react-bootstrap'
import { useWeb3 } from '@/context/Web3Context'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiCopy } from 'react-icons/fi'

const WalletModal = () => {
  const {
    showWalletModal,
    setShowWalletModal,
    isConnected,
    isConnecting,
    walletAddress,
    network,
    balance,
    walletType,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWeb3()

  const navigate = useNavigate()

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('¡Dirección de wallet copiada al portapapeles!')
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  return (
    <Modal
      show={showWalletModal}
      onHide={() => setShowWalletModal(false)}
      centered
      className="web3-wallet-modal"
    >
      <Modal.Header closeButton className="border-bottom border-light">
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconifyIcon icon="solar:wallet-bold-duotone" className="text-warning fs-3" />
          <span>Conexión Wallet Web3 (Testnet)</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        {isConnected && walletAddress ? (
          <div>
            <div className="card wallet-status-card mb-3 p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-success-subtle text-success border border-success d-flex align-items-center gap-1">
                  <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '8px', height: '8px' }}></span>
                  Conectado ({walletType})
                </span>
                <span className="badge bg-secondary-subtle text-secondary fw-mono">
                  {network}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <small className="text-muted d-block">Dirección de Wallet</small>
                  <strong className="fs-5 text-gold font-monospace">
                    {formatAddress(walletAddress)}
                  </strong>
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleCopy(walletAddress)}
                  title="Copiar dirección"
                  aria-label="Copiar dirección de Wallet"
                >
                  <FiCopy aria-hidden="true" />
                </Button>
              </div>
              <hr className="my-2 border-secondary" />
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">Balance de Pruebas:</small>
                <span className="fw-bold wallet-balance">{balance}</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">Entorno de Pruebas Blockchain:</label>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Button
                  variant={network.includes('Testnet') ? 'warning' : 'outline-secondary'}
                  size="sm"
                  className="flex-fill"
                  onClick={() => switchNetwork('Blockchain Testnet (Pruebas)')}
                >
                  Testnet Red de Pruebas
                </Button>
                <Button
                  variant={network.includes('DevNet') ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="flex-fill"
                  onClick={() => switchNetwork('Local DevNet Sandbox')}
                >
                  Local DevNet Sandbox
                </Button>
              </div>
            </div>

            <div className="d-grid gap-2 mt-4">
              <Button
                variant="warning"
                className="fw-semibold text-dark"
                onClick={() => {
                  setShowWalletModal(false)
                  navigate('/certificates')
                }}
              >
                <IconifyIcon icon="solar:diploma-bold-duotone" className="me-2 fs-5" />
                Ver Mis Certificados SBT (ERC-5192)
              </Button>

              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  disconnectWallet()
                  toast.info('Wallet desconectada')
                }}
              >
                Desconectar Wallet
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-muted text-center mb-4">
              Conecta tu billetera digital Web3 para hacer pruebas de emisión y verificación de certificados universitarios en la blockchain.
            </p>

            <div className="d-grid gap-3">
              <Button
                variant="outline-warning"
                className="d-flex align-items-center justify-content-between p-3 border-2"
                disabled={isConnecting}
                onClick={() => connectWallet('MetaMask')}
              >
                <div className="d-flex align-items-center gap-3">
                  <IconifyIcon icon="logos:metamask-icon" className="fs-2" />
                  <div className="text-start">
                    <div className="fw-bold text-body">MetaMask (Testnet)</div>
                    <small className="text-muted">Conectar usando extensión de pruebas</small>
                  </div>
                </div>
                {isConnecting ? (
                  <span className="spinner-border spinner-border-sm text-warning" role="status"></span>
                ) : (
                  <IconifyIcon icon="solar:alt-arrow-right-bold-duotone" className="fs-4 text-warning" />
                )}
              </Button>

              <Button
                variant="outline-primary"
                className="d-flex align-items-center justify-content-between p-3 border-2"
                disabled={isConnecting}
                onClick={() => connectWallet('WalletConnect')}
              >
                <div className="d-flex align-items-center gap-3">
                  <IconifyIcon icon="simple-icons:walletconnect" className="fs-2 text-primary" />
                  <div className="text-start">
                    <div className="fw-bold text-body">WalletConnect (Testnet)</div>
                    <small className="text-muted">Escanear código QR de pruebas</small>
                  </div>
                </div>
                <IconifyIcon icon="solar:alt-arrow-right-bold-duotone" className="fs-4 text-primary" />
              </Button>

              <Button
                variant="outline-info"
                className="d-flex align-items-center justify-content-between p-3 border-2"
                disabled={isConnecting}
                onClick={() => connectWallet('Coinbase Wallet')}
              >
                <div className="d-flex align-items-center gap-3">
                  <IconifyIcon icon="simple-icons:coinbase" className="fs-2 text-info" />
                  <div className="text-start">
                    <div className="fw-bold text-body">Coinbase Wallet</div>
                    <small className="text-muted">Conexión de pruebas</small>
                  </div>
                </div>
                <IconifyIcon icon="solar:alt-arrow-right-bold-duotone" className="fs-4 text-info" />
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default WalletModal
