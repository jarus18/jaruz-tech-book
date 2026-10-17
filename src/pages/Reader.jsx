import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { pdfjsLib } from '../lib/pdf'
import { supabase } from '../lib/supabase'
import { getPdfUrl } from '../lib/storage'
import { useAuth } from '../context/AuthContext'

const THEMES = { light: 'Oq', sepia: 'Sepia', dark: 'Tungi' }

function loadPref(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function savePref(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // brauzer saqlashga ruxsat bermasa, sozlama shu sessiyada qoladi
  }
}

export default function Reader() {
  const { id } = useParams()
  const { user } = useAuth()

  const [book, setBook] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [theme, setTheme] = useState(() => loadPref('reader-theme', 'light'))
  const [panel, setPanel] = useState(null) // 'outline' | 'search' | null
  const [outline, setOutline] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [toolbarHidden, setToolbarHidden] = useState(false)

  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const renderTask = useRef(null)
  const saveTimer = useRef(null)
  const touchStart = useRef(null)
  const [stageWidth, setStageWidth] = useState(800)

  // Kitob, PDF va oxirgi o'qilgan joyni yuklash
  useEffect(() => {
    let doc = null
    let cancelled = false
    async function load() {
      const { data: b } = await supabase.from('books').select('*').eq('id', id).maybeSingle()
      if (!b) return setError('Kitob topilmadi.')
      setBook(b)
      let pdfUrl
      try {
        pdfUrl = await getPdfUrl(b)
      } catch (e) {
        return setError('PDF faylni ochib bo\'lmadi: ' + e.message)
      }
      const { data: prog } = await supabase
        .from('reading_progress')
        .select('page')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      try {
        doc = await pdfjsLib.getDocument(pdfUrl).promise
      } catch (e) {
        return setError('PDF faylni o\'qib bo\'lmadi: ' + e.message)
      }
      if (cancelled) return doc.destroy()
      setPdf(doc)
      const start = Math.min(Math.max(prog?.page ?? 1, 1), doc.numPages)
      setPage(start)
      supabase
        .from('shelves')
        .upsert({ user_id: user.id, book_id: id, shelf: 'reading' }, { ignoreDuplicates: true })
        .then(() => {})
      const items = await doc.getOutline().catch(() => null)
      if (items && !cancelled) setOutline(items)
    }
    load()
    return () => {
      cancelled = true
      doc?.destroy()
    }
  }, [id, user.id])

  // Ekran kengligini kuzatish
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [pdf])

  // Joriy sahifani chizish
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false
    async function render() {
      const p = await pdf.getPage(page)
      if (cancelled) return
      const base = p.getViewport({ scale: 1 })
      // Sahifa ekran kengligiga moslanadi, katta ekranda esa o'qish uchun qulay 900px bilan cheklanadi
      const fit = Math.min(stageWidth - 16, 900) / base.width
      const scale = fit * zoom
      const dpr = window.devicePixelRatio || 1
      const viewport = p.getViewport({ scale: scale * dpr })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      renderTask.current?.cancel()
      renderTask.current = p.render({ canvasContext: canvas.getContext('2d'), viewport })
      try {
        await renderTask.current.promise
      } catch {
        // yangi sahifa chizila boshlanganda eskisi bekor qilinadi
      }
    }
    render()
    setPageInput(String(page))
    stageRef.current?.scrollTo({ top: 0 })
    return () => {
      cancelled = true
    }
  }, [pdf, page, zoom, stageWidth])

  // O'qish joyini saqlash (1 soniya kutib)
  useEffect(() => {
    if (!pdf) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase
        .from('reading_progress')
        .upsert({ user_id: user.id, book_id: id, page, total_pages: pdf.numPages, updated_at: new Date().toISOString() })
        .then(() => {})
      if (page === pdf.numPages) {
        supabase
          .from('shelves')
          .upsert({ user_id: user.id, book_id: id, shelf: 'finished' }, { ignoreDuplicates: true })
          .then(() => {})
      }
    }, 1000)
    return () => clearTimeout(saveTimer.current)
  }, [page, pdf, id, user.id])

  const goTo = useCallback(
    (n) => {
      if (!pdf) return
      setPage(Math.min(Math.max(1, n), pdf.numPages))
    },
    [pdf],
  )

  // Klaviatura
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        goTo(page + 1)
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        goTo(page - 1)
      } else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.15, 3))
      else if (e.key === '-') setZoom((z) => Math.max(z - 0.15, 0.4))
      else if (e.key === 'Home') goTo(1)
      else if (e.key === 'End') goTo(pdf?.numPages ?? 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, goTo, pdf])

  function onTouchStart(e) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e) {
    if (!touchStart.current || zoom > 1) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(page + (dx < 0 ? 1 : -1))
    touchStart.current = null
  }

  function changeTheme(t) {
    setTheme(t)
    savePref('reader-theme', t)
  }

  async function openOutlineItem(item) {
    try {
      const dest = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest
      if (!dest) return
      const index = await pdf.getPageIndex(dest[0])
      goTo(index + 1)
      if (window.innerWidth < 800) setPanel(null)
    } catch {
      // ba'zi PDF'larda mundarija noto'g'ri bo'ladi
    }
  }

  async function runSearch(e) {
    e.preventDefault()
    const term = searchTerm.trim().toLowerCase()
    if (!term || !pdf) return
    setSearching(true)
    const results = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const p = await pdf.getPage(i)
      const text = (await p.getTextContent()).items.map((it) => it.str).join(' ')
      const idx = text.toLowerCase().indexOf(term)
      if (idx !== -1) {
        results.push({ page: i, snippet: text.slice(Math.max(0, idx - 40), idx + term.length + 60) })
        setSearchResults([...results])
      }
    }
    setSearchResults(results)
    setSearching(false)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.()
  }

  if (error) {
    return (
      <div className="center">
        <p>{error}</p>
        <Link to="/">Bosh sahifaga qaytish</Link>
      </div>
    )
  }

  const total = pdf?.numPages ?? 0
  const percent = total ? Math.round((page / total) * 100) : 0

  return (
    <div className={`reader theme-${theme}`}>
      <div className={'reader-toolbar' + (toolbarHidden ? ' hidden' : '')}>
        <Link to={`/kitob/${id}`} className="icon-btn" title="Orqaga">←</Link>
        <div className="reader-title" title={book?.title}>{book?.title ?? 'Yuklanmoqda...'}</div>
        <div className="reader-tools">
          <button className="icon-btn" title="Mundarija" onClick={() => setPanel(panel === 'outline' ? null : 'outline')}>☰</button>
          <button className="icon-btn" title="Qidirish" onClick={() => setPanel(panel === 'search' ? null : 'search')}>⌕</button>
          <button className="icon-btn" title="Kichraytirish" onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}>−</button>
          <button className="icon-btn zoom-label" title="Ekranga moslash" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button className="icon-btn" title="Kattalashtirish" onClick={() => setZoom((z) => Math.min(z + 0.15, 3))}>+</button>
          <select value={theme} onChange={(e) => changeTheme(e.target.value)} title="Rang rejimi">
            {Object.entries(THEMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="icon-btn" title="To'liq ekran" onClick={toggleFullscreen}>⛶</button>
        </div>
      </div>

      <div className="reader-body">
        {panel && (
          <aside className="reader-panel">
            {panel === 'outline' && (
              <>
                <h3>Mundarija</h3>
                {outline.length === 0 ? (
                  <div className="muted small">Bu kitobda mundarija yo'q.</div>
                ) : (
                  <OutlineList items={outline} onOpen={openOutlineItem} />
                )}
              </>
            )}
            {panel === 'search' && (
              <>
                <h3>Kitob ichidan qidirish</h3>
                <form onSubmit={runSearch}>
                  <input
                    autoFocus
                    type="search"
                    placeholder="So'z yoki ibora"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
                {searching && <div className="muted small">Qidirilmoqda...</div>}
                {searchResults && !searching && searchResults.length === 0 && (
                  <div className="muted small">Topilmadi. Skanerlangan kitoblarda qidiruv ishlamasligi mumkin.</div>
                )}
                <ul className="search-results">
                  {searchResults?.map((r) => (
                    <li key={r.page}>
                      <button onClick={() => goTo(r.page)}>
                        <strong>{r.page}-bet</strong>
                        <span>…{r.snippet}…</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        )}

        <div
          className="reader-stage"
          ref={stageRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onDoubleClick={() => setToolbarHidden((h) => !h)}
        >
          {!pdf && <div className="center muted">Kitob ochilmoqda...</div>}
          <canvas ref={canvasRef} className="reader-canvas" />
        </div>
      </div>

      <div className={'reader-footer' + (toolbarHidden ? ' hidden' : '')}>
        <button className="icon-btn" onClick={() => goTo(page - 1)} disabled={page <= 1}>‹ Oldingi</button>
        <form
          className="page-jump"
          onSubmit={(e) => {
            e.preventDefault()
            goTo(Number(pageInput) || page)
          }}
        >
          <input value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
          <span>/ {total}</span>
        </form>
        <button className="icon-btn" onClick={() => goTo(page + 1)} disabled={page >= total}>Keyingi ›</button>
        <div className="reader-progress" title={`${percent}%`}>
          <div style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  )
}

function OutlineList({ items, onOpen }) {
  return (
    <ul className="outline">
      {items.map((item, i) => (
        <li key={i}>
          <button onClick={() => onOpen(item)}>{item.title}</button>
          {item.items?.length > 0 && <OutlineList items={item.items} onOpen={onOpen} />}
        </li>
      ))}
    </ul>
  )
}
