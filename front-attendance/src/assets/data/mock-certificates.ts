export interface CertificateItem {
  id: string
  eventId: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  recipientName: string
  recipientEmail: string
  recipientWallet: string
  status: 'Minted' | 'Pending'
  tokenId?: string
  contractAddress: string
  network: string
  standard: string
  isLocked: boolean
  txHash?: string
  blockNumber?: number
  ipfsHash?: string
  issuedAt?: string
  grade?: string
  hours: number
  skills: string[]
}

export interface MockEventCertSummary {
  id: string
  title: string
  date: string
  time: string
  location: string
  status: 'PUBLICADO' | 'BORRADOR' | 'COMPLETADO'
  totalAttendees: number
  maxCapacity: number
  issuedCertificates: number
  pendingCertificates: number
  contractAddress: string
  certificates: CertificateItem[]
}

export const MOCK_EVENTS_CERTIFICATES: MockEventCertSummary[] = [
  {
    id: 'evt-001',
    title: 'evento de prueba',
    date: '17/4/2026',
    time: '09:00 - 17:00',
    location: 'Cochabamba',
    status: 'PUBLICADO',
    totalAttendees: 1,
    maxCapacity: 100,
    issuedCertificates: 1,
    pendingCertificates: 0,
    contractAddress: '0x8F3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    certificates: [
      {
        id: 'cert-101',
        eventId: 'evt-001',
        eventName: 'evento de prueba',
        eventDate: '17/4/2026',
        eventTime: '09:00 - 17:00',
        location: 'Cochabamba',
        recipientName: 'Juan Sebastián Pérez',
        recipientEmail: 'juan.perez@univalle.edu',
        recipientWallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        status: 'Minted',
        tokenId: '#SBT-0001',
        contractAddress: '0x8F3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        network: 'Blockchain Testnet (Red de Pruebas)',
        standard: 'ERC-5192 (Soulbound Token)',
        isLocked: true,
        txHash: '0xa4e98f731c280b1e42846f3910c0e5a8421c9711209bc192834b9281a8ef11a9',
        blockNumber: 4829103,
        ipfsHash: 'ipfs://QmX9a8B7c6D5e4F3g2H1j0k9L8m7N6o5P4q3R2s1T0uV',
        issuedAt: '17/04/2026 17:15',
        grade: 'Aprobado con Excelencia',
        hours: 8,
        skills: ['Blockchain Web3', 'Asistencia Verificada', 'Smart Contracts ERC-5192']
      }
    ]
  },
  {
    id: 'evt-002',
    title: 'Eventos Para el 8/10/20206',
    date: '12/8/2026',
    time: '09:00 - 17:00',
    location: 'Cochabamba',
    status: 'BORRADOR',
    totalAttendees: 2,
    maxCapacity: 100,
    issuedCertificates: 1,
    pendingCertificates: 1,
    contractAddress: '0x3F8a90B1990c7E9381c19b671a5F92b02891901a',
    certificates: [
      {
        id: 'cert-102',
        eventId: 'evt-002',
        eventName: 'Eventos Para el 8/10/20206',
        eventDate: '12/8/2026',
        eventTime: '09:00 - 17:00',
        location: 'Cochabamba',
        recipientName: 'Juan Sebastián Pérez',
        recipientEmail: 'juan.perez@univalle.edu',
        recipientWallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        status: 'Minted',
        tokenId: '#SBT-0002',
        contractAddress: '0x3F8a90B1990c7E9381c19b671a5F92b02891901a',
        network: 'Blockchain Testnet (Red de Pruebas)',
        standard: 'ERC-5192 (Soulbound Token)',
        isLocked: true,
        txHash: '0xb8714e19823f99a176e5200ba124810c9491c6e18231024bcda98a101f68749b',
        blockNumber: 4831200,
        ipfsHash: 'ipfs://QmY8b9C0d1E2f3G4h5I6j7K8l9M0n1O2p3Q4r5S6t7Uv',
        issuedAt: '12/08/2026 17:30',
        grade: 'Participación Activa',
        hours: 8,
        skills: ['Desarrollo Web', 'Gestión de Eventos', 'Seguridad en Redes']
      },
      {
        id: 'cert-103',
        eventId: 'evt-002',
        eventName: 'Eventos Para el 8/10/20206',
        eventDate: '12/8/2026',
        eventTime: '09:00 - 17:00',
        location: 'Cochabamba',
        recipientName: 'María Rodríguez Vargas',
        recipientEmail: 'maria.rodriguez@univalle.edu',
        recipientWallet: '0x3C44CdD45a694a048000A5B54b684F66C2c50259',
        status: 'Pending',
        contractAddress: '0x3F8a90B1990c7E9381c19b671a5F92b02891901a',
        network: 'Blockchain Testnet (Red de Pruebas)',
        standard: 'ERC-5192 (Soulbound Token)',
        isLocked: true,
        hours: 8,
        skills: ['Desarrollo Web', 'Gestión de Eventos']
      }
    ]
  }
]
