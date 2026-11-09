import { FiAward, FiLogOut } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const MemberHeader = () => {
  const { logout } = useAuthContext()

  return (
    <header className="member-header">
      <Link to="/my-certificates" className="member-brand"><FiAward aria-hidden="true" /> Academic<span>SBT</span></Link>
      <button type="button" className="member-logout" onClick={logout}>
        <FiLogOut aria-hidden="true" /> Cerrar sesión
      </button>
    </header>
  )
}

export default MemberHeader
