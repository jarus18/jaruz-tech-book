import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminReviews() {
  const [approved, setApproved] = useState(false)
  const [reviews, setReviews] = useState(null)

  function load() {
    supabase
      .from('reviews')
      .select('*, books(id, title)')
      .eq('is_approved', approved)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews(data ?? []))
  }
  useEffect(load, [approved])

  async function approve(r) {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', r.id)
    load()
  }

  async function remove(r) {
    if (!confirm("Sharhni o'chirasizmi?")) return
    await supabase.from('reviews').delete().eq('id', r.id)
    load()
  }

  return (
    <>
      <div className="tabs">
        <button className={'tab' + (!approved ? ' active' : '')} onClick={() => setApproved(false)}>Tasdiq kutayotganlar</button>
        <button className={'tab' + (approved ? ' active' : '')} onClick={() => setApproved(true)}>Tasdiqlanganlar</button>
      </div>
      {!reviews ? (
        <div className="muted">Yuklanmoqda...</div>
      ) : reviews.length === 0 ? (
        <div className="muted">Sharh yo'q.</div>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="review">
            <div className="row space-between">
              <span>
                <span className="stars">{'★'.repeat(r.rating)}</span>{' '}
                <Link to={`/kitob/${r.books?.id}`}>{r.books?.title}</Link>
              </span>
              <span className="row">
                {!r.is_approved && <button className="btn btn-small" onClick={() => approve(r)}>Tasdiqlash</button>}
                <button className="btn-link danger" onClick={() => remove(r)}>O'chirish</button>
              </span>
            </div>
            {r.body && <p>{r.body}</p>}
            <div className="muted small">{new Date(r.created_at).toLocaleString('uz-UZ')}</div>
          </div>
        ))
      )}
    </>
  )
}
