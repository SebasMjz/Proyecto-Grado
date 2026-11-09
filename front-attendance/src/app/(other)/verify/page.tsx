import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import httpClient from '@/helpers/httpClient'

type Verification = {
  verified: boolean
  status: string
  participant_name: string | null
  event_title: string | null
  issued_at: string | null
  transaction_hash: string
  chain_id: number | null
}

const VerifyCertificatePage = () => {
  const { code } = useParams()
  const [result, setResult] = useState<Verification | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    httpClient.get<Verification>(`/verify/${code}/`)
      .then(({ data }) => setResult(data))
      .catch(() => setError('No se pudo verificar el certificado. Comprueba el código o vuelve a intentarlo.'))
  }, [code])

  return <main className="member-screen"><div className="member-container">
    <header className="member-header"><Link to="/" className="member-brand">VRIS · Certificados</Link></header>
    <div className="member-intro"><h1>Verificar certificado</h1><p>Consulta pública de autenticidad en blockchain.</p></div>
    {error ? <div className="member-empty member-error" role="alert">{error}</div> : !result ?
      <div className="member-empty" role="status">Consultando certificado…</div> :
      <article className="member-detail">
        <div className="member-detail-facts">
          <h2>{result.verified ? 'Certificado verificado' : 'Certificado sin confirmación blockchain'}</h2>
          <dl>
            <div><dt>Titular</dt><dd>{result.participant_name || 'No disponible'}</dd></div>
            <div><dt>Evento</dt><dd>{result.event_title || 'No disponible'}</dd></div>
            <div><dt>Estado</dt><dd>{result.status === 'pending_wallet' ? 'Esperando billetera' : result.status === 'pending_chain' ? 'Esperando confirmación' : result.status === 'confirmed' && result.verified ? 'Confirmado e intransferible' : 'No verificado'}</dd></div>
            {result.transaction_hash && <div><dt>Transacción</dt><dd>{result.chain_id === 11155111 ?
              <a href={`https://sepolia.etherscan.io/tx/${result.transaction_hash}`} target="_blank" rel="noopener noreferrer">Ver en Sepolia</a> : result.transaction_hash}</dd></div>}
          </dl>
        </div>
      </article>}
  </div></main>
}

export default VerifyCertificatePage
