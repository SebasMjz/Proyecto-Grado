import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { FiAward, FiArrowLeft } from 'react-icons/fi'
import httpClient from '@/helpers/httpClient'
import { useAuthContext } from '@/context/useAuthContext'
import MemberHeader from './MemberHeader'
import type { Certificate } from './page'

const CertificateDetailPage = () => {
  const { user } = useAuthContext()
  const { certificateId } = useParams()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wallet, setWallet] = useState(user?.wallet_address || '')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    httpClient.get<Certificate>(`/certificates/${certificateId}/`)
      .then(({ data }) => { if (active) setCertificate(data) })
      .catch((reason: unknown) => {
        if (active) setError(axios.isAxiosError(reason) && reason.response?.status === 404
          ? 'Este certificado no existe o no está disponible en tu cuenta.'
          : 'No pudimos cargar el certificado. Inténtalo de nuevo más tarde.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [certificateId])

  const linkWallet = async () => {
    const provider = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
    if (!provider) { setActionError('Necesitas una billetera compatible con MetaMask para vincularla.'); return }
    setBusy(true)
    setActionError('')
    try {
      const [address] = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      const { data } = await httpClient.get<{ message: string }>('/me/wallet-challenge/')
      const signature = await provider.request({ method: 'personal_sign', params: [data.message, address] }) as string
      const linked = await httpClient.post<{ wallet_address: string }>('/me/wallet-challenge/', { address, signature })
      setWallet(linked.data.wallet_address)
    } catch {
      setActionError('No se pudo verificar la firma. Confirma la solicitud en tu billetera e inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const updateChain = async (action: 'mint' | 'sync') => {
    setBusy(true)
    setActionError('')
    try {
      const { data } = await httpClient.post<Certificate>(`/certificates/${certificateId}/${action}/`)
      setCertificate(data)
    } catch (reason: unknown) {
      setActionError(axios.isAxiosError(reason)
        ? String(reason.response?.data?.detail || 'No se pudo consultar Sepolia. Inténtalo más tarde.')
        : 'No se pudo consultar Sepolia. Inténtalo más tarde.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="member-screen">
      <div className="member-container">
        <MemberHeader />
        <div className="member-intro">
          <Link to="/my-certificates" className="member-back-link"><FiArrowLeft aria-hidden="true" /> Mis certificados</Link>
          <h1>Detalle del certificado</h1>
        </div>
        {loading ? (
          <div className="member-empty" role="status">Cargando certificado…</div>
        ) : error ? (
          <div className="member-empty member-error" role="alert">
            <p>{error}</p>
            <Link to="/my-certificates" className="member-view-link">Volver a mis certificados</Link>
          </div>
        ) : certificate && (
          <article className="member-detail">
            <div className="member-certificate-icon"><FiAward aria-hidden="true" /></div>
            <div>
              <p className="member-certificate-label">Certificado emitido</p>
              <h2>{certificate.snapshot.event_title || certificate.registration.event.title}</h2>
              <p>Otorgado a {certificate.snapshot.participant_name || `${certificate.registration.participant.first_name} ${certificate.registration.participant.last_name}`}</p>
            </div>
            <dl className="member-detail-facts">
              <div><dt>Fecha de emisión</dt><dd>{new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(certificate.issued_at))}</dd></div>
              <div><dt>Evento</dt><dd>{certificate.registration.event.start_date} · {certificate.registration.event.location}</dd></div>
              <div><dt>Código del certificado</dt><dd className="member-certificate-code">{certificate.certificate_code}</dd></div>
              <div><dt>Estado blockchain</dt><dd>{{
                legacy: 'Emisión anterior · sin respaldo blockchain',
                pending_wallet: 'Pendiente de vincular billetera', pending_chain: 'Transacción pendiente',
                confirmed: 'SBT confirmado e intransferible', failed: 'Transacción fallida',
              }[certificate.blockchain_status]}</dd></div>
              {certificate.transaction_hash && <div><dt>Transacción</dt><dd className="member-certificate-code">{certificate.chain_id === 11155111 ?
                <a href={`https://sepolia.etherscan.io/tx/${certificate.transaction_hash}`} target="_blank" rel="noopener noreferrer">Ver en Sepolia</a> : certificate.transaction_hash}</dd></div>}
            </dl>
            <div className="member-actions">
              {(certificate.blockchain_status === 'pending_wallet' || certificate.blockchain_status === 'failed') && <>
                <p>{wallet ? `Billetera vinculada: ${wallet}` : 'Vincula tu billetera para recibir este certificado intransferible en Sepolia.'}</p>
                {!wallet && <button type="button" disabled={busy} onClick={linkWallet}>Vincular billetera</button>}
                {wallet && <button type="button" disabled={busy} onClick={() => updateChain('mint')}>{certificate.blockchain_status === 'failed' ? 'Reintentar registro en Sepolia' : 'Registrar certificado en Sepolia'}</button>}
              </>}
              {certificate.blockchain_status === 'pending_chain' && <button type="button" disabled={busy} onClick={() => updateChain('sync')}>Consultar confirmación</button>}
              {certificate.blockchain_status === 'confirmed' && <Link to={`/verify/${certificate.certificate_code}`}>Verificar autenticidad</Link>}
              {actionError && <p role="alert" className="member-error">{actionError}</p>}
            </div>
          </article>
        )}
      </div>
    </main>
  )
}

export default CertificateDetailPage
