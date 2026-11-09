import { useEffect, useState } from 'react'
import { FiAward } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import httpClient from '@/helpers/httpClient'
import MemberHeader from './MemberHeader'

export type Certificate = {
  id: string
  certificate_code: string
  issued_at: string
  blockchain_status: 'legacy' | 'pending_wallet' | 'pending_chain' | 'confirmed' | 'failed'
  transaction_hash: string
  chain_id: number | null
  snapshot: { event_title?: string; participant_name?: string }
  registration: {
    event: { title: string; description: string; location: string; start_date: string; end_date: string }
    participant: { first_name: string; last_name: string }
  }
}

type CertificatePageResponse = {
  count: number
  results: Certificate[]
}

const MemberCertificatesPage = () => {
  const { user } = useAuthContext()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    httpClient.get<CertificatePageResponse | Certificate[]>(`/certificates/?page=${page}`)
      .then(({ data }) => {
        if (!active) return
        const rows = Array.isArray(data) ? data : data.results
        setCertificates(rows)
        setCount(Array.isArray(data) ? rows.length : data.count)
      })
      .catch(() => {
        if (active) setError('No pudimos cargar tus certificados. Inténtalo de nuevo más tarde.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [page])

  return (
    <main className="member-screen">
      <div className="member-container">
        <MemberHeader />

        <section className="member-intro">
          <h1>Mis certificados</h1>
          <p>Consulta los certificados emitidos al correo <strong>{user?.email}</strong>.</p>
        </section>

        {loading ? (
          <div className="member-empty" role="status">Cargando tus certificados…</div>
        ) : error ? (
          <div className="member-empty member-error" role="alert">{error}</div>
        ) : certificates.length === 0 ? (
          <div className="member-empty">
            <FiAward aria-hidden="true" />
            <h2>Aún no tienes certificados</h2>
            <p>Cuando se emita uno a tu correo, aparecerá aquí.</p>
          </div>
        ) : (
          <>
            <div className="member-certificate-grid">
              {certificates.map((certificate) => (
                <article className="member-certificate" key={certificate.id}>
                  <div className="member-certificate-icon"><FiAward aria-hidden="true" /></div>
                  <div>
                    <p className="member-certificate-label">Certificado emitido</p>
                    <h2>{certificate.snapshot.event_title || certificate.registration.event.title}</h2>
                    <p className="member-certificate-owner">
                      {certificate.snapshot.participant_name || `${certificate.registration.participant.first_name} ${certificate.registration.participant.last_name}`}
                    </p>
                    <p className="member-certificate-date">
                      Emitido el {new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(certificate.issued_at))}
                    </p>
                    <div className="member-certificate-code">Código: {certificate.certificate_code}</div>
                    <p className="member-certificate-date mt-2">{{
                      legacy: 'Emisión anterior · sin respaldo blockchain',
                      pending_wallet: 'Emitido · pendiente de vincular billetera',
                      pending_chain: 'Transacción enviada · pendiente de confirmación',
                      confirmed: 'Confirmado en blockchain · intransferible',
                      failed: 'No se confirmó la transacción',
                    }[certificate.blockchain_status]}</p>
                    <Link className="member-view-link" to={`/my-certificates/${certificate.id}`}>
                      Ver certificado
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {count > 10 && (
              <nav className="member-pagination" aria-label="Páginas de certificados">
                <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
                <span>Página {page} de {Math.ceil(count / 10)}</span>
                <button type="button" disabled={page * 10 >= count} onClick={() => setPage(page + 1)}>Siguiente</button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default MemberCertificatesPage
