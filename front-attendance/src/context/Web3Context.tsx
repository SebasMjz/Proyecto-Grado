import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Web3ContextType {
  walletAddress: string | null
  isConnected: boolean
  isConnecting: boolean
  network: string
  balance: string
  walletType: string | null
  showWalletModal: boolean
  setShowWalletModal: (show: boolean) => void
  connectWallet: (type?: string) => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (networkName: string) => void
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

const DEFAULT_WALLET = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [network, setNetwork] = useState<string>('Blockchain Testnet (Pruebas)')
  const [balance, setBalance] = useState<string>('1.45 TEST')
  const [walletType, setWalletType] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false)

  // Restore saved wallet connection state
  useEffect(() => {
    const savedConnected = localStorage.getItem('web3_is_connected')
    const savedAddress = localStorage.getItem('web3_address')
    const savedType = localStorage.getItem('web3_type')
    const savedNetwork = localStorage.getItem('web3_network')

    if (savedConnected === 'true' && savedAddress) {
      setIsConnected(true)
      setWalletAddress(savedAddress)
      setWalletType(savedType || 'MetaMask')
      if (savedNetwork) setNetwork(savedNetwork)
    }
  }, [])

  const connectWallet = async (type: string = 'MetaMask') => {
    setIsConnecting(true)
    // Simulate web3 wallet handshake / signature
    await new Promise((resolve) => setTimeout(resolve, 800))
    setWalletAddress(DEFAULT_WALLET)
    setIsConnected(true)
    setWalletType(type)
    setIsConnecting(false)
    setShowWalletModal(false)

    localStorage.setItem('web3_is_connected', 'true')
    localStorage.setItem('web3_address', DEFAULT_WALLET)
    localStorage.setItem('web3_type', type)
    localStorage.setItem('web3_network', network)
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress(null)
    setWalletType(null)
    localStorage.removeItem('web3_is_connected')
    localStorage.removeItem('web3_address')
    localStorage.removeItem('web3_type')
  }

  const switchNetwork = (networkName: string) => {
    setNetwork(networkName)
    localStorage.setItem('web3_network', networkName)
    if (networkName.includes('DevNet')) {
      setBalance('10.00 DEV')
    } else {
      setBalance('1.45 TEST')
    }
  }

  return (
    <Web3Context.Provider
      value={{
        walletAddress,
        isConnected,
        isConnecting,
        network,
        balance,
        walletType,
        showWalletModal,
        setShowWalletModal,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}
