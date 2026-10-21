import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LANGUAGES, supabase } from '../lib/supabase'
import { BookGrid } from '../components/BookCard'

const SORTS = {
  new: 'Avval yangilari',
  title: 'Nomi bo\'yicha (A-Z)',
  year: 'Nashr yili',
}

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const genre = params.get('janr') ?? ''
  const lang = params.get('til') ?? ''
  const sort = params.get('saralash') ?? 'new'

  const [genres, setGenres] = useState([])
  const [books, setBooks] = useState(null)
  const [text, setText] = useState(q)

  useEffect(() => setText(q), [q])

  useEffect(() => {
    supabase.from('genres').select('*').order('name').then(({ data }) => setGenres(data ?? []))
  }, [])

  useEffect(() => {
    let cancelled = false
    setBooks(null)

    async function load() {
      const select = genre ? '*, book_genres!inner(genre_id)' : '*'
      let query = supabase.from('books').select(select).eq('is_published', true)
      if (genre) query = query.eq('book_genres.genre_id', genre)
      if (lang) query = query.eq('language', lang)
      const term = q.trim().replace(/[%,()]/g, ' ')
      if (term) query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,description.ilike.%${term}%`)
      if (sort === 'title') query = query.order('title')
      else if (sort === 'year') query = query.order('year', { ascending: false, nullsFirst: false })
      else query = query.order('created_at', { ascending: false })

      const { data } = await query.limit(200)
      if (!cancelled) setBooks(data ?? [])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [q, genre, lang, sort])

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  function onSearch(e) {
    e.preventDefault()
    update('q', text.trim())
  }

  return (
    <>
      <h1>Katalog</h1>
      <div className="filters">
        <form onSubmit={onSearch}>
          <input
            type="search"
            placeholder="Nomi, muallifi yoki tavsifi bo'yicha qidirish"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </form>
        <select value={genre} onChange={(e) => update('janr', e.target.value)}>
          <option value="">Barcha janrlar</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select value={lang} onChange={(e) => update('til', e.target.value)}>
          <option value="">Barcha tillar</option>
          {Object.entries(LANGUAGES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => update('saralash', e.target.value === 'new' ? '' : e.target.value)}>
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <BookGrid books={books} empty="Hech narsa topilmadi." />
    </>
  )
}
