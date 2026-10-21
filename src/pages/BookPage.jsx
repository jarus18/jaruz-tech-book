import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { coverUrl, LANGUAGES, SHELVES, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Stars({ value }) {
  return <span className="stars">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
}

export default function BookPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [book, setBook] = useState(undefined)
  const [stats, setStats] = useState(null)
  const [progress, setProgress] = useState(null)
  const [shelves, setShelves] = useState([])
  const [reviews, setReviews] = useState([])
  const [myReview, setMyReview] = useState(null)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [report, setReport] = useState({ reason: '', contact: '' })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    supabase
      .from('books')
      .select('*, book_genres(genres(id, name))')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setBook(data))
    supabase.from('book_stats').select('*').eq('book_id', id).maybeSingle().then(({ data }) => setStats(data))
    supabase
      .from('reviews')
      .select('*')
      .eq('book_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews(data ?? []))
  }, [id])

  useEffect(() => {
    if (!user) return
    supabase
      .from('reading_progress')
      .select('*')
      .eq('book_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setProgress(data))
    supabase
      .from('shelves')
      .select('shelf')
      .eq('book_id', id)
      .eq('user_id', user.id)
      .then(({ data }) => setShelves((data ?? []).map((s) => s.shelf)))
    supabase
      .from('reviews')
      .select('*')
      .eq('book_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setMyReview(data))
  }, [id, user])

  async function toggleShelf(shelf) {
    if (!user) return navigate('/kirish')
    if (shelves.includes(shelf)) {
      await supabase.from('shelves').delete().match({ user_id: user.id, book_id: id, shelf })
      setShelves(shelves.filter((s) => s !== shelf))
    } else {
      await supabase.from('shelves').insert({ user_id: user.id, book_id: id, shelf })
      setShelves([...shelves, shelf])
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('reviews')
      .insert({ user_id: user.id, book_id: id, rating, body: body.trim() || null })
      .select()
      .single()
    if (error) return setNotice('Sharh yuborilmadi: ' + error.message)
    setMyReview(data)
    setNotice('Rahmat! Sharhingiz admin tasdiqlagandan keyin ko\'rinadi.')
  }

  async function submitReport(e) {
    e.preventDefault()
    const { error } = await supabase.from('reports').insert({
      book_id: id,
      user_id: user?.id ?? null,
      reason: report.reason.trim(),
      contact: report.contact.trim() || null,
    })
    if (error) return setNotice('Shikoyat yuborilmadi: ' + error.message)
    setReportOpen(false)
    setReport({ reason: '', contact: '' })
    setNotice('Shikoyatingiz qabul qilindi. Tez orada ko\'rib chiqamiz.')
  }

  if (book === undefined) return <div className="muted">Yuklanmoqda...</div>
  if (book === null) return <div>Kitob topilmadi. <Link to="/katalog">Katalogga qaytish</Link></div>

  const cover = coverUrl(book.cover_path)
  const genres = (book.book_genres ?? []).map((bg) => bg.genres).filter(Boolean)

  return (
    <div className="book-page">
      <div className="book-page-cover cover">
        {cover ? <img src={cover} alt={book.title} /> : <span>{book.title}</span>}
      </div>
      <div className="book-page-info">
        <h1>{book.title}</h1>
        <div className="author">{book.author}</div>
        <div className="meta muted">
          {[LANGUAGES[book.language] ?? book.language, book.year, book.pages && `${book.pages} bet`]
            .filter(Boolean)
            .join(' · ')}
        </div>
        {stats && (
          <div className="meta muted">
            {stats.avg_rating ? <>★ {stats.avg_rating} ({stats.review_count} sharh) · </> : null}
            {stats.readers} kishi o'qigan
          </div>
        )}
        {genres.length > 0 && (
          <div className="chips">
            {genres.map((g) => (
              <Link key={g.id} to={`/katalog?janr=${g.id}`} className="chip">{g.name}</Link>
            ))}
          </div>
        )}

        <div className="actions">
          <a href={book.file_url} target="_blank" rel="noreferrer" className="btn">
            {progress ? `Davom ettirish (${progress.page}-bet)` : "O'qishni boshlash"}
          </a>
        </div>

        <div className="shelf-buttons">
          {Object.entries(SHELVES).map(([key, label]) => (
            <button
              key={key}
              className={'chip' + (shelves.includes(key) ? ' active' : '')}
              onClick={() => toggleShelf(key)}
            >
              {shelves.includes(key) ? '✓ ' : '+ '}
              {label}
            </button>
          ))}
        </div>

        {book.description && <p className="description">{book.description}</p>}

        {(book.license || book.source) && (
          <div className="license muted small">
            {book.license && <div>Litsenziya: {book.license}</div>}
            {book.source && <div>Manba: {book.source}</div>}
          </div>
        )}

        {notice && <div className="notice">{notice}</div>}

        <section className="section">
          <h2>Sharhlar</h2>
          {user && !myReview && (
            <form className="review-form" onSubmit={submitReview}>
              <label>
                Baho:{' '}
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{'★'.repeat(n)}</option>
                  ))}
                </select>
              </label>
              <textarea
                placeholder="Kitob haqida fikringiz (ixtiyoriy)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
              <button className="btn btn-small">Yuborish</button>
            </form>
          )}
          {reviews.length === 0 ? (
            <div className="muted">Hali sharh yo'q.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="review">
                <Stars value={r.rating} />
                {r.body && <p>{r.body}</p>}
              </div>
            ))
          )}
        </section>

        <div className="report">
          {reportOpen ? (
            <form className="review-form" onSubmit={submitReport}>
              <textarea
                required
                placeholder="Muammo nimada? (masalan: mualliflik huquqi buzilgan, fayl ochilmayapti)"
                value={report.reason}
                onChange={(e) => setReport({ ...report, reason: e.target.value })}
                rows={3}
              />
              <input
                placeholder="Bog'lanish uchun email yoki telefon (ixtiyoriy)"
                value={report.contact}
                onChange={(e) => setReport({ ...report, contact: e.target.value })}
              />
              <div className="row">
                <button className="btn btn-small">Yuborish</button>
                <button type="button" className="btn-link" onClick={() => setReportOpen(false)}>Bekor qilish</button>
              </div>
            </form>
          ) : (
            <button className="btn-link small" onClick={() => setReportOpen(true)}>⚑ Shikoyat qilish</button>
          )}
        </div>
      </div>
    </div>
  )
}
