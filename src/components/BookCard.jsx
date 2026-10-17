import { Link } from 'react-router-dom'
import { coverUrl } from '../lib/supabase'

export default function BookCard({ book, progress }) {
  const cover = coverUrl(book.cover_path)
  return (
    <Link to={`/kitob/${book.id}`} className="book-card">
      <div className="cover">
        {cover ? <img src={cover} alt={book.title} loading="lazy" /> : <span>{book.title}</span>}
      </div>
      <div className="book-card-title">{book.title}</div>
      <div className="book-card-author muted">{book.author}</div>
      {progress != null && (
        <div className="progress-bar" title={`${progress}%`}>
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  )
}

export function BookGrid({ books, progressMap, empty = "Hozircha kitob yo'q." }) {
  if (!books) return <div className="muted">Yuklanmoqda...</div>
  if (books.length === 0) return <div className="muted">{empty}</div>
  return (
    <div className="book-grid">
      {books.map((b) => (
        <BookCard key={b.id} book={b} progress={progressMap?.[b.id]} />
      ))}
    </div>
  )
}
