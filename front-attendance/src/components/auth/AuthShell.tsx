import type { ReactNode } from 'react'
import { FiAward } from 'react-icons/fi'
import { Link } from 'react-router-dom'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

const AuthShell = ({ title, description, children, footer }: AuthShellProps) => (
  <main className="auth-screen">
    <section className="auth-panel" aria-labelledby="auth-title">
      <header className="auth-header">
        <Link to="/auth/login" className="auth-brand" aria-label="AcademicSBT, ir al inicio de sesión">
          <span className="auth-brand-icon"><FiAward aria-hidden="true" /></span>
          <span>Academic<span>SBT</span></span>
        </Link>
        <div className="auth-eyebrow">Asistencia y certificación digital</div>
        <h1 id="auth-title" className="auth-title">{title}</h1>
        <p className="auth-description">{description}</p>
      </header>
      {children}
      <footer className="auth-footer">{footer}</footer>
    </section>
  </main>
)

export default AuthShell
