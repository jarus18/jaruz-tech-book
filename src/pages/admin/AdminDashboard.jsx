import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count } = await q
  return count ?? 0
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [top, setTop] = useState([])

  useEffect(() => {
    async function load() {
      const [books, users, pendingReviews, openReports] = await Promise.all([
        count('books'),
        count('profiles'),
        count('reviews', (q) => q.eq('is_approved', false)),
        count('reports', (q) => q.eq('resolved', false)),
      ])
      const { data: s } = await supabase.from('book_stats').select('book_id, readers').order('readers', { ascending: false })
      const readers = (s ?? []).reduce((sum, r) => sum + Number(r.readers), 0)
      setStats({ books, users, pendingReviews, openReports, readers })
      const topIds = (s ?? []).filter((r) => r.readers > 0).slice(0, 10)
      if (topIds.length) {
        const { data: b } = await supabase.from('books').select('id, title, author').in('id', topIds.map((r) => r.book_id))
        setTop(topIds.map((r) => ({ ...b.find((x) => x.id === r.book_id), readers: r.readers })))
      }
    }
    load()
  }, [])

  if (!stats) return <div className="muted">Yuklanmoqda...</div>

  return (
    <>
      <div className="stat-grid">
        <div className="stat"><div className="stat-value">{stats.books}</div><div className="muted">Kitoblar</div></div>
        <div className="stat"><div className="stat-value">{stats.users}</div><div className="muted">Foydalanuvchilar</div></div>
        <div className="stat"><div className="stat-value">{stats.readers}</div><div className="muted">O'qishlar soni</div></div>
        <Link to="/admin/sharhlar" className="stat"><div className="stat-value">{stats.pendingReviews}</div><div className="muted">Tasdiq kutayotgan sharhlar</div></Link>
        <Link to="/admin/shikoyatlar" className="stat"><div className="stat-value">{stats.openReports}</div><div className="muted">Ochiq shikoyatlar</div></Link>
      </div>
      <section className="section">
        <h2>Eng ko'p o'qilgan kitoblar</h2>
        {top.length === 0 ? (
          <div className="muted">Hali hech kim kitob o'qimagan.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Kitob</th><th>Muallif</th><th>O'quvchilar</th></tr></thead>
            <tbody>
              {top.map((b) => (
                <tr key={b.id}><td><Link to={`/kitob/${b.id}`}>{b.title}</Link></td><td>{b.author}</td><td>{b.readers}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
