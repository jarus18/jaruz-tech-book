import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LANGUAGES, supabase } from '../lib/supabase'
import { BookGrid } from '../components/BookCard'

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const genre = params.get('janr') ?? ''
  const lang = params.get('til') ?? ''
  const sort = params.get('saralash') ?? 'new'

  const [genres, setGenres] = useState([])
  const [books, setBooks] = useState(null)
  const [query, setQuery] = useState(q)

  useEffect(() => setQuery(q), [q])

  useEffect(() => {
    supabase.from('genres').select('*').order('name').then(({ data }) => setGenres(data ?? []))
  }, [])

  useEffect(() => {
    let cancelled = false
    setBooks(null)
    async function load() {
      let req = supabase
        .from('books')
        .select(genre ? '*, book_genres!inner(genre_id)' : '*')
        .eq('is_published', true)
      if (genre) req = req.eq('book_genres.genre_id', genre)
      if (lang) req = req.eq('language', lang)
      const term = q.replace(/[,()%]/g, ' ').trim()
      if (term) req = req.or(`title.ilike.%${term}%,author.ilike.%${term}%,description.ilike.%${term}%`)
      req = sort === 'title' ? req.order('title') : req.order('created_at', { ascending: false })
      const { data } = await req.limit(200)
      let list = data ?? []
      if (sort === 'popular' && list.length) {
        const { data: stats } = await supabase
          .from('book_stats')
          .select('book_id, readers')
          .in('book_id', list.map((b) => b.id))
        const readers = Object.fromEntries((stats ?? []).map((s) => [s.book_id, s.readers]))
        list = [...list].sort((a, b) => (readers[b.id] ?? 0) - (readers[a.id] ?? 0))
      }
      if (!cancelled) setBooks(list)
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

  return (
    <>
      <h1>Katalog</h1>
      <div className="filters">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            update('q', query.trim())
          }}
        >
          <input
            type="search"
            placeholder="Nomi, muallifi yoki kalit so'z"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          <option value="new">Avval yangilari</option>
          <option value="popular">Eng ko'p o'qilgan</option>
          <option value="title">Nomi bo'yicha (A-Z)</option>
        </select>
      </div>
      <BookGrid books={books} empty="Hech narsa topilmadi." />
    </>
  )
}
