import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BookGrid } from '../components/BookCard'

export default function Home() {
  const { user } = useAuth()
  const [latest, setLatest] = useState(null)
  const [popular, setPopular] = useState(null)
  const [genres, setGenres] = useState([])
  const [continuing, setContinuing] = useState(null)

  useEffect(() => {
    supabase
      .from('books')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => setLatest(data ?? []))

    supabase
      .from('book_stats')
      .select('book_id, readers')
      .gt('readers', 0)
      .order('readers', { ascending: false })
      .limit(12)
      .then(async ({ data }) => {
        const ids = (data ?? []).map((r) => r.book_id)
        if (ids.length === 0) return setPopular([])
        const { data: books } = await supabase.from('books').select('*').in('id', ids)
        setPopular(ids.map((id) => books.find((b) => b.id === id)).filter(Boolean))
      })

    supabase.from('genres').select('*').order('name').then(({ data }) => setGenres(data ?? []))
  }, [])

  useEffect(() => {
    if (!user) return setContinuing(null)
    supabase
      .from('reading_progress')
      .select('page, total_pages, books(*)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setContinuing(data ?? []))
  }, [user])

  const progressMap = Object.fromEntries(
    (continuing ?? []).map((r) => [r.books?.id, r.total_pages ? Math.round((r.page / r.total_pages) * 100) : 0]),
  )

  return (
    <>
      <section className="hero">
        <h1>Kitoblarni qulay o'qing</h1>
        <p className="muted">Kutubxonadan kitob tanlang va istalgan qurilmada to'xtagan joyingizdan davom eting.</p>
        <Link to="/katalog" className="btn">Katalogni ko'rish</Link>
      </section>

      {genres.length > 0 && (
        <div className="chips">
          {genres.map((g) => (
            <Link key={g.id} to={`/katalog?janr=${g.id}`} className="chip">{g.name}</Link>
          ))}
        </div>
      )}

      {continuing && continuing.length > 0 && (
        <section className="section">
          <h2>Davom ettirish</h2>
          <BookGrid books={continuing.map((r) => r.books).filter(Boolean)} progressMap={progressMap} />
        </section>
      )}

      <section className="section">
        <h2>Yangi qo'shilganlar</h2>
        <BookGrid books={latest} />
      </section>

      {popular && popular.length > 0 && (
        <section className="section">
          <h2>Eng ko'p o'qilganlar</h2>
          <BookGrid books={popular} />
        </section>
      )}
    </>
  )
}
