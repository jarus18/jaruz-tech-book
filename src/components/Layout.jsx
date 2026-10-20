import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  function onSearch(e) {
    e.preventDefault()
    navigate(`/katalog?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">📖 Jamshidbek Rustamov kutubxonasi</Link>
          <form className="header-search" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="Kitob yoki muallif..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <nav className="nav">
            <NavLink to="/katalog">Katalog</NavLink>
            {user && <NavLink to="/javonim">Javonim</NavLink>}
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
            {user ? (
              <button className="btn-link" onClick={signOut}>Chiqish</button>
            ) : (
              <NavLink to="/kirish" className="btn btn-small">Kirish</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="container main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="muted">Jaruz Tech soft</span>
          <strong>Jaruz Tech soft</strong>
        </div>
      </footer>
    </>
  )
}
