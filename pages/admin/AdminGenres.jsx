import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminGenres() {
  const [genres, setGenres] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function load() {
    supabase.from('genres').select('*').order('name').then(({ data }) => setGenres(data ?? []))
  }
  useEffect(load, [])

  async function add(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('genres').insert({ name: name.trim() })
    if (error) return setError(error.message.includes('duplicate') ? 'Bunday janr bor.' : error.message)
    setName('')
    load()
  }

  async function rename(g) {
    const next = prompt('Yangi nom', g.name)
    if (!next || next.trim() === g.name) return
    await supabase.from('genres').update({ name: next.trim() }).eq('id', g.id)
    load()
  }

  async function remove(g) {
    if (!confirm(`"${g.name}" janrini o'chirasizmi? Kitoblar o'chmaydi.`)) return
    await supabase.from('genres').delete().eq('id', g.id)
    load()
  }

  return (
    <>
      <form className="row" onSubmit={add}>
        <input placeholder="Yangi janr nomi" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn btn-small">Qo'shish</button>
      </form>
      {error && <div className="notice">{error}</div>}
      <table className="table">
        <tbody>
          {genres.map((g) => (
            <tr key={g.id}>
              <td>{g.name}</td>
              <td className="row">
                <button className="btn-link" onClick={() => rename(g)}>Nomini o'zgartirish</button>
                <button className="btn-link danger" onClick={() => remove(g)}>O'chirish</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
