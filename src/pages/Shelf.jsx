import { useEffect, useState } from 'react'
import { SHELVES, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BookGrid } from '../components/BookCard'

export default function Shelf() {
  const { user } = useAuth()
  const [tab, setTab] = useState('reading')
  const [rows, setRows] = useState(null)
  const [progress, setProgress] = useState({})

  useEffect(() => {
    supabase
      .from('shelves')
      .select('shelf, books(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []))
    supabase
      .from('reading_progress')
      .select('book_id, page, total_pages')
      .eq('user_id', user.id)
      .then(({ data }) =>
        setProgress(
          Object.fromEntries(
            (data ?? []).map((r) => [r.book_id, r.total_pages ? Math.round((r.page / r.total_pages) * 100) : 0]),
          ),
        ),
      )
  }, [user.id])

  const books = rows?.filter((r) => r.shelf === tab).map((r) => r.books).filter(Boolean) ?? null
  const counts = Object.fromEntries(Object.keys(SHELVES).map((k) => [k, rows?.filter((r) => r.shelf === k).length ?? 0]))

  return (
    <>
      <h1>Mening javonim</h1>
      <div className="tabs">
        {Object.entries(SHELVES).map(([key, label]) => (
          <button key={key} className={'tab' + (tab === key ? ' active' : '')} onClick={() => setTab(key)}>
            {label} <span className="muted">{counts[key]}</span>
          </button>
        ))}
      </div>
      <BookGrid books={books} progressMap={progress} empty="Bu javonda hali kitob yo'q." />
    </>
  )
}
