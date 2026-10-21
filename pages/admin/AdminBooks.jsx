import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { coverUrl, supabase } from '../../lib/supabase'
import { deletePdf } from '../../lib/storage'

export default function AdminBooks() {
  const [books, setBooks] = useState(null)
  const [filter, setFilter] = useState('')

  function load() {
    supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setBooks(data ?? []))
  }
  useEffect(load, [])

  async function togglePublished(b) {
    await supabase.from('books').update({ is_published: !b.is_published }).eq('id', b.id)
    load()
  }

  async function remove(b) {
    if (!confirm(`"${b.title}" kitobini butunlay o'chirasizmi?`)) return
    try {
      await deletePdf(b.pdf_path)
    } catch (e) {
      return alert("PDF faylni o'chirib bo'lmadi: " + e.message)
    }
    if (b.cover_path) await supabase.storage.from('covers').remove([b.cover_path])
    await supabase.from('books').delete().eq('id', b.id)
    load()
  }

  const term = filter.trim().toLowerCase()
  const shown = books?.filter((b) => !term || b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term))

  return (
    <>
      <div className="row space-between">
        <input type="search" placeholder="Kitob qidirish" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Link to="/admin/kitoblar/yangi" className="btn">+ Kitob qo'shish</Link>
      </div>
      {!shown ? (
        <div className="muted">Yuklanmoqda...</div>
      ) : shown.length === 0 ? (
        <div className="muted">Kitob yo'q. Birinchi kitobni qo'shing.</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th></th><th>Nomi</th><th>Muallif</th><th>Holati</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((b) => (
              <tr key={b.id}>
                <td className="thumb">{b.cover_path && <img src={coverUrl(b.cover_path)} alt="" />}</td>
                <td><Link to={`/kitob/${b.id}`}>{b.title}</Link></td>
                <td>{b.author}</td>
                <td>
                  <button className={'chip' + (b.is_published ? ' active' : '')} onClick={() => togglePublished(b)}>
                    {b.is_published ? 'Chop etilgan' : 'Yashirin'}
                  </button>
                </td>
                <td className="row">
                  <Link to={`/admin/kitoblar/${b.id}`}>Tahrirlash</Link>
                  <button className="btn-link danger" onClick={() => remove(b)}>O'chirish</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
