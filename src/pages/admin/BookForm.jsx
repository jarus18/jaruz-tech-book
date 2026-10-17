import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { coverUrl, LANGUAGES, supabase } from '../../lib/supabase'
import { readPdfInfo } from '../../lib/pdf'
import { deletePdf, uploadPdf } from '../../lib/storage'

const EMPTY = {
  title: '',
  author: '',
  description: '',
  language: 'uz',
  year: '',
  pages: '',
  license: '',
  source: '',
  is_published: true,
}

export default function BookForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [existing, setExisting] = useState(null)
  const [genres, setGenres] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [pdfFile, setPdfFile] = useState(null)
  const [coverBlob, setCoverBlob] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('genres').select('*').order('name').then(({ data }) => setGenres(data ?? []))
    if (isNew) return
    supabase
      .from('books')
      .select('*, book_genres(genre_id)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setExisting(data)
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? EMPTY[k]])),
        })
        setSelectedGenres(data.book_genres.map((g) => g.genre_id))
        setCoverPreview(coverUrl(data.cover_path))
      })
  }, [id, isNew])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function onPdf(e) {
    const file = e.target.files[0]
    if (!file) return
    setPdfFile(file)
    setStatus('PDF o\'qilmoqda...')
    try {
      const info = await readPdfInfo(file)
      setCoverBlob(info.cover)
      setCoverPreview(URL.createObjectURL(info.cover))
      setForm((f) => ({
        ...f,
        pages: info.pages,
        title: f.title || info.title || file.name.replace(/\.pdf$/i, ''),
        author: f.author || info.author,
      }))
      setStatus('')
    } catch (err) {
      setStatus('PDF faylni o\'qib bo\'lmadi: ' + err.message)
    }
  }

  function onCover(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverBlob(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function toggleGenre(gid) {
    setSelectedGenres((s) => (s.includes(gid) ? s.filter((x) => x !== gid) : [...s, gid]))
  }

  async function save(e) {
    e.preventDefault()
    if (isNew && !pdfFile) return setStatus('PDF faylni tanlang.')
    setBusy(true)
    try {
      const bookId = existing?.id ?? crypto.randomUUID()
      let pdf_path = existing?.pdf_path
      let cover_path = existing?.cover_path ?? null

      if (pdfFile) {
        setStatus('PDF yuklanmoqda... 0%')
        pdf_path = await uploadPdf(bookId, pdfFile, (p) => setStatus(`PDF yuklanmoqda... ${p}%`))
        // eski kitob Supabase Storage'da bo'lsa, u yerdagi nusxani o'chiramiz
        if (existing?.pdf_path && existing.pdf_path !== pdf_path) await deletePdf(existing.pdf_path).catch(() => {})
      }
      if (coverBlob) {
        setStatus('Muqova yuklanmoqda...')
        cover_path = `${bookId}-${Date.now()}.jpg`
        const { error } = await supabase.storage
          .from('covers')
          .upload(cover_path, coverBlob, { upsert: true, contentType: coverBlob.type || 'image/jpeg' })
        if (error) throw error
        if (existing?.cover_path) await supabase.storage.from('covers').remove([existing.cover_path])
      }

      setStatus('Saqlanmoqda...')
      const row = {
        id: bookId,
        title: form.title.trim(),
        author: form.author.trim(),
        description: form.description.trim() || null,
        language: form.language,
        year: form.year ? Number(form.year) : null,
        pages: form.pages ? Number(form.pages) : null,
        license: form.license.trim() || null,
        source: form.source.trim() || null,
        is_published: form.is_published,
        pdf_path,
        cover_path,
      }
      const { error } = await supabase.from('books').upsert(row)
      if (error) throw error

      await supabase.from('book_genres').delete().eq('book_id', bookId)
      if (selectedGenres.length) {
        const { error: gErr } = await supabase
          .from('book_genres')
          .insert(selectedGenres.map((genre_id) => ({ book_id: bookId, genre_id })))
        if (gErr) throw gErr
      }
      navigate('/admin/kitoblar')
    } catch (err) {
      setStatus('Xato: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="book-form" onSubmit={save}>
      <div className="book-form-side">
        <div className="cover">{coverPreview ? <img src={coverPreview} alt="" /> : <span>Muqova</span>}</div>
        <label className="file-label">
          {isNew ? 'PDF fayl *' : 'PDF faylni almashtirish'}
          <input type="file" accept="application/pdf" onChange={onPdf} required={isNew} />
        </label>
        <label className="file-label">
          Boshqa muqova rasmi (ixtiyoriy)
          <input type="file" accept="image/*" onChange={onCover} />
        </label>
        <div className="muted small">Muqova PDF'ning birinchi sahifasidan avtomatik olinadi.</div>
      </div>

      <div className="form">
        <h2>{isNew ? 'Yangi kitob' : 'Kitobni tahrirlash'}</h2>
        <label>Nomi *<input value={form.title} onChange={set('title')} required /></label>
        <label>Muallif *<input value={form.author} onChange={set('author')} required /></label>
        <label>Tavsif<textarea rows={5} value={form.description} onChange={set('description')} /></label>
        <div className="row">
          <label>
            Til
            <select value={form.language} onChange={set('language')}>
              {Object.entries(LANGUAGES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label>Nashr yili<input type="number" value={form.year} onChange={set('year')} /></label>
          <label>Sahifalar<input type="number" value={form.pages} onChange={set('pages')} /></label>
        </div>
        <fieldset>
          <legend>Janrlar</legend>
          <div className="chips">
            {genres.map((g) => (
              <button
                type="button"
                key={g.id}
                className={'chip' + (selectedGenres.includes(g.id) ? ' active' : '')}
                onClick={() => toggleGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Litsenziya
          <input value={form.license} onChange={set('license')} placeholder="Masalan: Ochiq litsenziya, Muallif ruxsati" />
        </label>
        <label>
          Manba
          <input value={form.source} onChange={set('source')} placeholder="Kitob qayerdan olingani yoki kim ruxsat bergani" />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.is_published} onChange={set('is_published')} />
          Chop etilsin (hammaga ko'rinadi)
        </label>
        {status && <div className="notice">{status}</div>}
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? 'Saqlanmoqda...' : 'Saqlash'}</button>
          <button type="button" className="btn-link" onClick={() => navigate('/admin/kitoblar')}>Bekor qilish</button>
        </div>
      </div>
    </form>
  )
}
