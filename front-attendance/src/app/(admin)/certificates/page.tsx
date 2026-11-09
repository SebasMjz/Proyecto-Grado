import { useState } from 'react'
import { Row, Col, Card, CardBody, CardHeader, Table, Button, Badge, Modal, ProgressBar, Form } from 'react-bootstrap'
import PageTitle from '@/components/PageTItle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useWeb3 } from '@/context/Web3Context'
import { MOCK_EVENTS_CERTIFICATES, CertificateItem } from '@/assets/data/mock-certificates'
import { toast } from 'react-toastify'

const CertificatesPage = () => {
  const { isConnected, walletAddress, setShowWalletModal } = useWeb3()

  // Mode state: 'admin' or 'user'
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin')

  // Selected event in admin view
  const [selectedEventId, setSelectedEventId] = useState<string>('evt-001')

  // Certificate state
  const [eventsData, setEventsData] = useState(MOCK_EVENTS_CERTIFICATES)

  // Selected certificate for diploma modal
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)

  // Selected certificate for explorer modal
  const [explorerCert, setExplorerCert] = useState<CertificateItem | null>(null)

  // Minting process modal state
  const [isMintingModalOpen, setIsMintingModalOpen] = useState<boolean>(false)
  const [mintingStep, setMintingStep] = useState<number>(0)
  const [targetCertToMint, setTargetCertToMint] = useState<CertificateItem | null>(null)

  const activeEvent = eventsData.find((e) => e.id === selectedEventId) || eventsData[0]

  // Filter student certificates for the logged user
  const userCertificates = eventsData
    .flatMap((e) => e.certificates)
    .filter(
      (c) =>
        c.recipientWallet.toLowerCase() === (walletAddress || '0x71c7656ec7ab88b098defb751b7401b5f6d8976f').toLowerCase() ||
        c.recipientName.includes('Juan')
    )

  // Trigger minting simulation
  const startMintingProcess = (cert: CertificateItem) => {
    setTargetCertToMint(cert)
    setMintingStep(1)
    setIsMintingModalOpen(true)

    // Step 1: Upload IPFS Metadata
    setTimeout(() => {
      setMintingStep(2)
      // Step 2: Sign web3 tx
      setTimeout(() => {
        setMintingStep(3)
        // Step 3: Mined on block
        setTimeout(() => {
          const updated = eventsData.map((evt) => ({
            ...evt,
            certificates: evt.certificates.map((c) => {
              if (c.id === cert.id) {
                return {
                  ...c,
                  status: 'Minted' as const,
                  tokenId: `#SBT-000${Math.floor(Math.random() * 800) + 100}`,
                  txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                  blockNumber: 4831205,
                  issuedAt: new Date().toLocaleString(),
                  ipfsHash: `ipfs://Qm${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
                }
              }
              return c
            })
          }))
          setEventsData(updated)
          toast.success('¡Certificado SBT (ERC-5192) acuñado exitosamente en Testnet Blockchain!')
        }, 1400)
      }, 1400)
    }, 1200)
  }

  const formatHash = (hash?: string) => {
    if (!hash) return 'N/A'
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`
  }

  // Count total minted vs pending in current view
  const totalCertificates = activeEvent.certificates.length
  const mintedCertificates = activeEvent.certificates.filter((c) => c.status === 'Minted').length
  const pendingCertificates = totalCertificates - mintedCertificates

  return (
    <div className="py-2">
      <PageTitle title={'Protocolo de Certificación SBT (ERC-5192) · Web3'} />

      {/* Main Mode Switcher & Web3 Console Header */}
      <div
        className="p-4 mb-4 rounded-4"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.06)'
        }}
      >
        <Row className="align-items-center g-3">
          <Col lg={7} md={12}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '52px',
                  height: '52px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#d97706'
                }}
              >
                <IconifyIcon icon="solar:diploma-verified-bold-duotone" style={{ fontSize: '30px' }} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <h3 className="fw-bold mb-0" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Emisión de Certificados SBT
                  </h3>
                  <span className="badge-sbt px-2 py-0.5 rounded small">ERC-5192 Soulbound</span>
                  <span className="badge-verified px-2 py-0.5 rounded small">Testnet EVM</span>
                </div>
                <p className="small mb-0" style={{ color: '#475569' }}>
                  Credenciales intransferibles atadas criptográficamente a la dirección del participante con metadata IPFS.
                </p>
              </div>
            </div>
          </Col>

          <Col lg={5} md={12}>
            <div className="d-flex align-items-center justify-content-lg-end gap-2 flex-wrap">
              {/* Persona Mode Switcher */}
              <div
                className="p-1 rounded-pill d-flex align-items-center"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${
                    viewMode === 'admin'
                      ? 'btn-primary shadow-sm'
                      : 'border-0 bg-transparent'
                  }`}
                  style={{ color: viewMode === 'admin' ? '#ffffff' : '#475569' }}
                  onClick={() => setViewMode('admin')}
                >
                  <IconifyIcon icon="solar:shield-user-bold-duotone" className="me-1" />
                  Admin Emisión
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${
                    viewMode === 'user'
                      ? 'btn-primary shadow-sm'
                      : 'border-0 bg-transparent'
                  }`}
                  style={{ color: viewMode === 'user' ? '#ffffff' : '#475569' }}
                  onClick={() => setViewMode('user')}
                >
                  <IconifyIcon icon="solar:user-bold-duotone" className="me-1" />
                  Mi Pasaporte
                </button>
              </div>

              {/* Wallet Button */}
              <Button
                variant={isConnected ? 'outline-primary' : 'primary'}
                size="sm"
                className="d-flex align-items-center gap-2 rounded-pill px-3 py-1 fw-semibold"
                onClick={() => setShowWalletModal(true)}
              >
                <IconifyIcon icon="solar:wallet-bold-duotone" />
                <span className={isConnected ? 'font-monospace' : ''}>
                  {isConnected ? formatHash(walletAddress || '') : 'Conectar Wallet'}
                </span>
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* ========================================================================= */}
      {/* VISTA ADMINISTRADOR (ADMIN MODE) */}
      {/* ========================================================================= */}
      {viewMode === 'admin' && (
        <>
          {/* Admin Stats Row */}
          <Row className="g-3 mb-4">
            <Col xl={3} md={6}>
              <Card className="h-100 p-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <CardBody className="p-1 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small d-block mb-1" style={{ color: '#64748b' }}>Aforo Aprobado</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>{totalCertificates} Participantes</h3>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: '44px', height: '44px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                  >
                    <IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" style={{ fontSize: '22px' }} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="h-100 p-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <CardBody className="p-1 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small d-block mb-1" style={{ color: '#64748b' }}>SBTs Acuñados en Bloque</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#059669' }}>{mintedCertificates} Emitidos</h3>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: '44px', height: '44px', background: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' }}
                  >
                    <IconifyIcon icon="solar:check-circle-bold-duotone" style={{ fontSize: '22px' }} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="h-100 p-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <CardBody className="p-1 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small d-block mb-1" style={{ color: '#64748b' }}>Pendientes de Firma</span>
                    <h3 className="mb-0 fw-bold" style={{ color: '#d97706' }}>{pendingCertificates} Por Mintear</h3>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: '44px', height: '44px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}
                  >
                    <IconifyIcon icon="solar:clock-circle-bold-duotone" style={{ fontSize: '22px' }} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="h-100 p-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <CardBody className="p-1 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small d-block mb-1" style={{ color: '#64748b' }}>Smart Contract</span>
                    <h6 className="mb-0 fw-bold font-monospace" style={{ color: '#0284c7' }}>{formatHash(activeEvent.contractAddress)}</h6>
                  </div>
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: '44px', height: '44px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}
                  >
                    <IconifyIcon icon="solar:atom-bold-duotone" style={{ fontSize: '22px' }} />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Certificate Management Console */}
          <Card className="border-0 shadow-sm mb-4" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <CardHeader className="py-3 px-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <Row className="align-items-center g-2">
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon="solar:server-bold-duotone" style={{ fontSize: '1.4rem', color: '#d97706' }} />
                    <div>
                      <h5 className="card-title mb-0 fw-bold" style={{ color: '#0f172a' }}>
                        Gestión de Acreditaciones por Evento
                      </h5>
                      <small style={{ color: '#64748b' }}>Emisión masiva y control de inmutabilidad on-chain</small>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="d-flex align-items-center justify-content-md-end gap-2">
                    <Form.Label className="mb-0 text-nowrap fw-semibold small" style={{ color: '#475569' }}>
                      Evento:
                    </Form.Label>
                    <Form.Select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="form-select-sm w-auto fw-bold"
                      style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }}
                    >
                      {eventsData.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.title} ({evt.date})
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
              </Row>
            </CardHeader>

            <CardBody className="p-4">
              {/* Event Metadata Banner */}
              <div
                className="p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge-verified px-2 py-0.5 rounded small">{activeEvent.status}</span>
                    <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>{activeEvent.title}</h5>
                  </div>
                  <div className="small d-flex align-items-center gap-3 flex-wrap" style={{ color: '#475569' }}>
                    <span><IconifyIcon icon="solar:calendar-bold-duotone" style={{ color: '#d97706' }} className="me-1" />{activeEvent.date} ({activeEvent.time})</span>
                    <span><IconifyIcon icon="solar:map-point-bold-duotone" style={{ color: '#dc2626' }} className="me-1" />{activeEvent.location}</span>
                    <span><IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" style={{ color: '#0284c7' }} className="me-1" />{activeEvent.totalAttendees} Asistentes Registrados</span>
                  </div>
                </div>

                <div className="text-md-end">
                  <small className="d-block mb-1" style={{ color: '#64748b' }}>Contrato Solidity AcademicSBT (ERC-5192):</small>
                  <code className="px-2 py-1 rounded font-monospace small" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    {activeEvent.contractAddress}
                  </code>
                </div>
              </div>

              {/* Table of Attendees & Certificates */}
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Participante / Estudiante</th>
                      <th>Dirección Wallet</th>
                      <th>Token ID (SBT)</th>
                      <th>Estado Blockchain</th>
                      <th>Transacción TX Hash</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEvent.certificates.map((cert) => (
                      <tr key={cert.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                              style={{
                                width: '36px',
                                height: '36px',
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e'
                              }}
                            >
                              {cert.recipientName.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold" style={{ color: '#0f172a' }}>{cert.recipientName}</div>
                              <small style={{ color: '#64748b' }}>{cert.recipientEmail}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <code className="font-monospace small" style={{ color: '#475569' }}>{formatHash(cert.recipientWallet)}</code>
                        </td>

                        <td>
                          {cert.tokenId ? (
                            <span className="badge-sbt px-2 py-1 rounded small">
                              {cert.tokenId} (Locked)
                            </span>
                          ) : (
                            <span className="small" style={{ color: '#94a3b8' }}>Sin asignar</span>
                          )}
                        </td>

                        <td>
                          {cert.status === 'Minted' ? (
                            <span className="badge-verified px-2 py-1 rounded small d-inline-flex align-items-center gap-1">
                              <IconifyIcon icon="solar:check-circle-bold-duotone" />
                              Emitido Intransferible
                            </span>
                          ) : (
                            <span className="badge-sbt px-2 py-1 rounded small d-inline-flex align-items-center gap-1">
                              <IconifyIcon icon="solar:clock-circle-bold-duotone" />
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td>
                          {cert.txHash ? (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 font-monospace text-decoration-none d-flex align-items-center gap-1"
                              style={{ color: '#0284c7' }}
                              onClick={() => setExplorerCert(cert)}
                            >
                              <span>{formatHash(cert.txHash)}</span>
                              <IconifyIcon icon="solar:export-bold-duotone" />
                            </button>
                          ) : (
                            <span className="small" style={{ color: '#94a3b8' }}>Sin mintear</span>
                          )}
                        </td>

                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            {cert.status === 'Pending' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                className="d-flex align-items-center gap-1"
                                onClick={() => startMintingProcess(cert)}
                              >
                                <IconifyIcon icon="solar:bolt-bold-duotone" />
                                <span>Acuñar SBT</span>
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => setSelectedCert(cert)}
                                  title="Ver Diploma Oficial"
                                >
                                  <IconifyIcon icon="solar:diploma-bold-duotone" />
                                </Button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => setExplorerCert(cert)}
                                  title="Detalles Blockchain"
                                >
                                  <IconifyIcon icon="solar:link-bold-duotone" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* VISTA USUARIO / PARTICIPANTE (STUDENT PASSPORT MODE) */}
      {/* ========================================================================= */}
      {viewMode === 'user' && (
        <>
          {/* Student Profile Card */}
          <Card className="border-0 shadow-sm mb-4" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <CardBody className="p-4">
              <Row className="align-items-center g-3">
                <Col md={8}>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 flex-shrink-0"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: '#fef3c7',
                        border: '2px solid #fde68a',
                        color: '#d97706'
                      }}
                    >
                      JP
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h4 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Juan Sebastián Pérez</h4>
                        <span className="badge-verified px-2 py-0.5 rounded small">Participante Verificado</span>
                      </div>
                      <p className="mb-1 font-monospace small" style={{ color: '#b45309' }}>
                        <IconifyIcon icon="solar:wallet-bold-duotone" className="me-1" />
                        Wallet: {walletAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}
                      </p>
                      <small style={{ color: '#64748b' }}>
                        Ingeniería de Sistemas &bull; Código: EST-924332 &bull; Pasaporte Web3 de Asistencia
                      </small>
                    </div>
                  </div>
                </Col>

                <Col md={4} className="text-md-end">
                  <div
                    className="d-inline-block p-3 rounded-3 text-start"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <small className="d-block" style={{ color: '#64748b' }}>Certificados SBT Obtenidos:</small>
                    <h4 className="mb-0 fw-bold" style={{ color: '#d97706' }}>{userCertificates.length} Soulbound Tokens</h4>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* User Certificates Showcase Grid */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
              <IconifyIcon icon="solar:diploma-verified-bold-duotone" style={{ color: '#d97706' }} />
              <span>Mis Certificados Inmutables ({userCertificates.length})</span>
            </h4>
            <span className="small" style={{ color: '#64748b' }}>Estándar ERC-5192 &bull; Intransferible</span>
          </div>

          <Row className="g-3">
            {userCertificates.map((cert) => (
              <Col lg={6} md={12} key={cert.id}>
                <Card
                  className="h-100 position-relative overflow-hidden"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.06)'
                  }}
                >
                  {/* Card Header Strip */}
                  <div
                    className="p-3 d-flex justify-content-between align-items-center"
                    style={{
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <span className="badge-sbt px-2 py-0.5 rounded small">
                      ACADEMIC SBT &bull; SOULBOUND
                    </span>
                    {cert.status === 'Minted' ? (
                      <span className="badge-verified px-2 py-0.5 rounded small d-flex align-items-center gap-1">
                        <IconifyIcon icon="solar:lock-keyhole-bold" />
                        {cert.tokenId} (Locked)
                      </span>
                    ) : (
                      <span className="badge-sbt px-2 py-0.5 rounded small">Pendiente de Reclamo</span>
                    )}
                  </div>

                  <CardBody className="p-4 d-flex flex-column justify-content-between">
                    <div>
                      <h4 className="fw-bold mb-2" style={{ color: '#0f172a' }}>{cert.eventName}</h4>
                      <p className="small mb-3" style={{ color: '#475569' }}>
                        Acreditación académica otorgada a <strong style={{ color: '#d97706' }}>{cert.recipientName}</strong> por su participación verificada en {cert.location}.
                      </p>

                      <div
                        className="p-3 rounded-3 mb-3"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                      >
                        <Row className="g-2 text-center">
                          <Col xs={4} className="border-end border-light">
                            <small className="d-block" style={{ color: '#64748b' }}>Fecha</small>
                            <strong className="small" style={{ color: '#0f172a' }}>{cert.eventDate}</strong>
                          </Col>
                          <Col xs={4} className="border-end border-light">
                            <small className="d-block" style={{ color: '#64748b' }}>Duración</small>
                            <strong className="small" style={{ color: '#0f172a' }}>{cert.hours} hrs</strong>
                          </Col>
                          <Col xs={4}>
                            <small className="d-block" style={{ color: '#64748b' }}>Red</small>
                            <strong className="small" style={{ color: '#0284c7' }}>Testnet EVM</strong>
                          </Col>
                        </Row>
                      </div>

                      <div className="mb-3">
                        <small className="d-block mb-1" style={{ color: '#64748b' }}>Competencias adquiridas:</small>
                        <div className="d-flex flex-wrap gap-1">
                          {cert.skills.map((skill, idx) => (
                            <span key={idx} className="badge bg-light text-dark border fw-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                      {cert.status === 'Minted' ? (
                        <div className="d-flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-fill d-flex align-items-center justify-content-center gap-1"
                            onClick={() => setSelectedCert(cert)}
                          >
                            <IconifyIcon icon="solar:diploma-bold-duotone" />
                            <span>Ver Diploma Oficial</span>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="flex-fill d-flex align-items-center justify-content-center gap-1"
                            onClick={() => setExplorerCert(cert)}
                          >
                            <IconifyIcon icon="solar:link-bold-duotone" />
                            <span>Blockchain Explorer</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100 d-flex align-items-center justify-content-center gap-1"
                          onClick={() => startMintingProcess(cert)}
                        >
                          <IconifyIcon icon="solar:bolt-bold-duotone" />
                          <span>Acuñar Certificado SBT a mi Wallet</span>
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DIPLOMA OFICIAL ACADÉMICO */}
      {/* ========================================================================= */}
      <Modal
        show={!!selectedCert}
        onHide={() => setSelectedCert(null)}
        size="lg"
        centered
        className="certificate-modal"
      >
        <Modal.Header closeButton style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <Modal.Title className="d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
            <IconifyIcon icon="solar:diploma-verified-bold-duotone" style={{ color: '#d97706', fontSize: '1.75rem' }} />
            <span>Diploma Académico Oficial (SBT ERC-5192)</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4" style={{ background: '#f8fafc' }}>
          {selectedCert && (
            <div
              className="p-4 p-md-5 rounded-4 text-center position-relative"
              style={{
                background: '#ffffff',
                border: '2px solid #d97706',
                boxShadow: '0 10px 30px rgba(217, 119, 6, 0.1)',
                outline: '1px dashed rgba(217, 119, 6, 0.4)',
                outlineOffset: '-12px'
              }}
            >
              {/* Header Badge */}
              <div className="mb-3">
                <span className="badge-sbt px-3 py-1 rounded-pill small fw-bold text-uppercase">
                  Acreditación Universitaria Oficial &bull; Registro Inmutable
                </span>
              </div>

              <h2 className="fw-bold mb-2" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                CERTIFICADO DE APROBACIÓN & ASISTENCIA
              </h2>

              <p className="small mb-4" style={{ color: '#475569' }}>
                El Comité Académico y de Investigación hace constar que:
              </p>

              <div className="my-3 py-2 border-bottom border-warning d-inline-block px-5">
                <h1 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '2rem', letterSpacing: '-0.01em' }}>
                  {selectedCert.recipientName}
                </h1>
              </div>

              <p className="mt-3 mb-4" style={{ color: '#334155', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                Ha completado satisfactoriamente y con asistencia verificada en tiempo real el evento académico:
                <br />
                <strong className="d-block mt-2 fs-5" style={{ color: '#d97706' }}>{selectedCert.eventName}</strong>
              </p>

              {/* Cryptographic Details Card */}
              <div
                className="p-3 rounded-3 text-start mb-4"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  maxWidth: '560px',
                  margin: '0 auto'
                }}
              >
                <div className="d-flex justify-content-between mb-1 small">
                  <span style={{ color: '#64748b' }}>Estándar Criptográfico:</span>
                  <span className="font-monospace fw-semibold" style={{ color: '#d97706' }}>ERC-5192 (Soulbound Token - Locked)</span>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span style={{ color: '#64748b' }}>Fecha de Emisión:</span>
                  <span style={{ color: '#0f172a' }}>{selectedCert.eventDate}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span style={{ color: '#64748b' }}>Token ID:</span>
                  <span className="font-monospace fw-semibold" style={{ color: '#d97706' }}>{selectedCert.tokenId}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span style={{ color: '#64748b' }}>Smart Contract:</span>
                  <span className="font-monospace" style={{ color: '#0284c7' }}>{formatHash(selectedCert.contractAddress)}</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span style={{ color: '#64748b' }}>Metadata Descentralizada:</span>
                  <span className="font-monospace" style={{ color: '#0284c7' }}>{formatHash(selectedCert.ipfsHash || 'ipfs://QmAcademicMetadata')}</span>
                </div>
              </div>

              {/* QR Verification Seal */}
              <div className="d-flex justify-content-around align-items-center pt-3 border-top border-light">
                <div className="text-start">
                  <small className="d-block" style={{ color: '#64748b' }}>Firmado Criptográficamente por:</small>
                  <strong style={{ color: '#d97706' }}>Comité Evaluador dApp</strong>
                  <small className="d-block" style={{ color: '#64748b' }}>Testnet Smart Contract Verified</small>
                </div>

                <div className="bg-white p-2 rounded-3 border shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://testnet.explorer/tx/${selectedCert.txHash || '0xverified'}`}
                    alt="QR Verification"
                    width={80}
                    height={80}
                  />
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <Button variant="outline-secondary" onClick={() => setSelectedCert(null)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => toast.success('Descargando copia digital verificada del certificado...')}
          >
            <IconifyIcon icon="solar:download-minimalistic-bold-duotone" className="me-1" />
            Descargar Certificado
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: BLOCKCHAIN EXPLORER */}
      {/* ========================================================================= */}
      <Modal
        show={!!explorerCert}
        onHide={() => setExplorerCert(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <Modal.Title className="d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
            <IconifyIcon icon="solar:link-bold-duotone" style={{ color: '#0284c7', fontSize: '1.75rem' }} />
            <span>Explorador de Transacción Blockchain Testnet</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4" style={{ background: '#ffffff' }}>
          {explorerCert && (
            <div>
              <div
                className="p-3 rounded-3 mb-3"
                style={{ background: '#e0f2fe', border: '1px solid #bae6fd' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge-verified px-2 py-0.5 rounded small">
                    <IconifyIcon icon="solar:check-circle-bold" className="me-1" />
                    Transacción Confirmada en Bloque
                  </span>
                  <span className="badge bg-light text-primary border">Testnet EVM (Pruebas)</span>
                </div>
                <small className="d-block" style={{ color: '#475569' }}>Transaction Hash (TxHash):</small>
                <code className="font-monospace small text-break" style={{ color: '#0369a1' }}>{explorerCert.txHash}</code>
              </div>

              <Table borderless responsive className="small">
                <tbody>
                  <tr>
                    <td style={{ color: '#64748b', width: '32%' }}>Estado de Confirmación:</td>
                    <td><span className="badge-verified px-2 py-0.5 rounded">Éxito (42 Bloques Validados)</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Bloque #:</td>
                    <td><span className="font-monospace" style={{ color: '#0284c7' }}>#{explorerCert.blockNumber}</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Estándar de Token:</td>
                    <td><span className="badge-sbt px-2 py-0.5 rounded">ERC-5192 (Soulbound Token - Intransferible)</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Estado Soulbound Lock:</td>
                    <td><Badge bg="danger">locked(tokenId) = true</Badge></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Smart Contract:</td>
                    <td><code style={{ color: '#d97706' }}>{explorerCert.contractAddress}</code></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Token ID:</td>
                    <td><strong style={{ color: '#0f172a' }}>{explorerCert.tokenId}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Receptor (Billetera):</td>
                    <td><code style={{ color: '#475569' }}>{explorerCert.recipientWallet}</code></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Almacenamiento IPFS:</td>
                    <td><code style={{ color: '#0284c7' }}>{explorerCert.ipfsHash}</code></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Costo de Gas:</td>
                    <td><span className="font-monospace" style={{ color: '#64748b' }}>0.00284 TEST ETH</span></td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <Button variant="outline-secondary" onClick={() => setExplorerCert(null)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MINTING TIMELINE SIMULATION */}
      {/* ========================================================================= */}
      <Modal
        show={isMintingModalOpen}
        onHide={() => {
          if (mintingStep === 3) setIsMintingModalOpen(false)
        }}
        centered
        backdrop="static"
      >
        <Modal.Header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <Modal.Title className="d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
            <IconifyIcon icon="solar:bolt-bold-duotone" style={{ color: '#d97706', fontSize: '1.75rem' }} />
            <span>Acuñando Certificado SBT en Blockchain...</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4" style={{ background: '#ffffff' }}>
          {targetCertToMint && (
            <div className="text-center">
              <h5 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>{targetCertToMint.eventName}</h5>
              <p className="small mb-3" style={{ color: '#64748b' }}>Destinatario: {targetCertToMint.recipientName}</p>

              <ProgressBar
                animated
                variant="warning"
                now={mintingStep === 1 ? 33 : mintingStep === 2 ? 66 : 100}
                className="mb-4"
                style={{ height: '8px', borderRadius: '999px', backgroundColor: '#e2e8f0' }}
              />

              <div
                className="text-start p-3 rounded-3 mb-3"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {/* Step 1 */}
                <div className={`d-flex align-items-center gap-2 mb-2 ${mintingStep >= 1 ? 'text-success fw-bold' : 'text-muted'}`}>
                  {mintingStep >= 1 ? (
                    <IconifyIcon icon="solar:check-circle-bold" className="fs-5 text-success" />
                  ) : (
                    <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                  )}
                  <span className="small">1. Generación y Pinning de Metadatos JSON en IPFS...</span>
                </div>

                {/* Step 2 */}
                <div className={`d-flex align-items-center gap-2 mb-2 ${mintingStep >= 2 ? 'text-success fw-bold' : 'text-muted'}`}>
                  {mintingStep >= 2 ? (
                    <IconifyIcon icon="solar:check-circle-bold" className="fs-5 text-success" />
                  ) : (
                    mintingStep === 1 && <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                  )}
                  <span className="small">2. Firma Criptográfica de Transacción Web3 (EVM)...</span>
                </div>

                {/* Step 3 */}
                <div className={`d-flex align-items-center gap-2 ${mintingStep >= 3 ? 'text-success fw-bold' : 'text-muted'}`}>
                  {mintingStep >= 3 ? (
                    <IconifyIcon icon="solar:check-circle-bold" className="fs-5 text-success" />
                  ) : (
                    mintingStep === 2 && <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                  )}
                  <span className="small">3. Bloque minado: Token ID emitido y bloqueado (Locked = true).</span>
                </div>
              </div>

              {mintingStep === 3 && (
                <div className="alert alert-success d-flex align-items-center gap-2 mt-3 mb-0" style={{ background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46' }}>
                  <IconifyIcon icon="solar:shield-check-bold" className="fs-4" />
                  <span>¡Certificado SBT (ERC-5192) acuñado con éxito e inmutable en Testnet!</span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>

        {mintingStep === 3 && (
          <Modal.Footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="primary"
              className="w-100"
              onClick={() => setIsMintingModalOpen(false)}
            >
              Finalizar y Volver a la Consola
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  )
}

export default CertificatesPage
