import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminReports() {
  const [resolved, setResolved] = useState(false)
  const [reports, setReports] = useState(null)

  function load() {
    supabase
      .from('reports')
      .select('*, books(id, title, is_published)')
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReports(data ?? []))
  }
  useEffect(load, [resolved])

  async function markResolved(r) {
    await supabase.from('reports').update({ resolved: true }).eq('id', r.id)
    load()
  }

  async function hideBook(r) {
    await supabase.from('books').update({ is_published: false }).eq('id', r.book_id)
    await markResolved(r)
  }

  return (
    <>
      <div className="tabs">
        <button className={'tab' + (!resolved ? ' active' : '')} onClick={() => setResolved(false)}>Ochiq</button>
        <button className={'tab' + (resolved ? ' active' : '')} onClick={() => setResolved(true)}>Hal qilingan</button>
      </div>
      {!reports ? (
        <div className="muted">Yuklanmoqda...</div>
      ) : reports.length === 0 ? (
        <div className="muted">Shikoyat yo'q.</div>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="review">
            <div className="row space-between">
              <Link to={`/kitob/${r.books?.id}`}>{r.books?.title}</Link>
              {!r.resolved && (
                <span className="row">
                  {r.books?.is_published && (
                    <button className="btn btn-small" onClick={() => hideBook(r)}>Kitobni yashirish</button>
                  )}
                  <button className="btn-link" onClick={() => markResolved(r)}>Hal qilindi</button>
                </span>
              )}
            </div>
            <p>{r.reason}</p>
            <div className="muted small">
              {r.contact && <>Aloqa: {r.contact} · </>}
              {new Date(r.created_at).toLocaleString('uz-UZ')}
            </div>
          </div>
        ))
      )}
    </>
  )
}
