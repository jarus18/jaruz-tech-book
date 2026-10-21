import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getPdfUrl } from '../lib/storage'
import { pdfjsLib } from '../lib/pdf'
import { useAuth } from '../context/AuthContext'

const THEMES = { light: 'Oq', sepia: 'Sepia', dark: 'Tungi' }
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]

function readPref(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function writePref(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // brauzer xotirasi yopiq bo'lsa, e'tibor bermaymiz
  }
}

function Outline({ items, onGo }) {
  return (
    <ul className="outline">
      {items.map((it, i) => (
        <li key={i}>
          <button onClick={() => onGo(it.dest)}>{it.title}</button>
          {it.items?.length > 0 && <Outline items={it.items} onGo={onGo} />}
        </li>
      ))}
    </ul>
  )
}

export default function Reader() {
  const { id } = useParams()
  const { user } = useAuth()

  const [book, setBook] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(() => Number(readPref('reader-zoom', '1')) || 1)
  const [theme, setTheme] = useState(() => readPref('reader-theme', 'light'))
  const [barsHidden, setBarsHidden] = useState(false)
  const [panel, setPanel] = useState(null) // 'outline' | 'search' | null
  const [outline, setOutline] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)

  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const renderTask = useRef(null)
  const touchStart = useRef(null)
  const saveTimer = useRef(null)

  const total = pdf?.numPages ?? 0

  // Kitob ma'lumoti, PDF va oxirgi o'qilgan sahifa
  useEffect(() => {
    let cancelled = false
    let loadingTask = null

    async function load() {
      setError('')
      const { data: b, error: bErr } = await supabase.from('books').select('*').eq('id', id).maybeSingle()
      if (cancelled) return
      if (bErr || !b) return setError("Kitob topilmadi yoki o'chirilgan.")
      setBook(b)

      let startPage = 1
      if (user) {
        const { data: p } = await supabase
          .from('reading_progress')
          .select('page')
          .eq('user_id', user.id)
          .eq('book_id', id)
          .maybeSingle()
        if (p?.page) startPage = p.page
      }

      try {
        const url = await getPdfUrl(b)
        loadingTask = pdfjsLib.getDocument({ url })
        const doc = await loadingTask.promise
        if (cancelled) return doc.destroy()
        setPdf(doc)
        setPage(Math.min(Math.max(1, startPage), doc.numPages))
        doc.getOutline().then((o) => !cancelled && setOutline(o ?? [])).catch(() => setOutline([]))
      } catch (e) {
        if (!cancelled) setError("PDF faylni ochib bo'lmadi: " + (e.message || e))
      }
    }
    load()

    return () => {
      cancelled = true
      loadingTask?.destroy()
    }
  }, [id, user])

  useEffect(() => () => pdf?.destroy(), [pdf])

  // Sahifani chizish
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false

    pdf.getPage(page).then((p) => {
      if (cancelled) return
      const stageWidth = (stageRef.current?.clientWidth ?? 800) - 16
      const base = p.getViewport({ scale: 1 })
      const fit = Math.min(stageWidth / base.width, 1.6)
      const scale = fit * zoom
      const ratio = window.devicePixelRatio || 1
      const viewport = p.getViewport({ scale: scale * ratio })
      const canvas = canvasRef.current
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / ratio)}px`
      canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
      renderTask.current?.cancel()
      renderTask.current = p.render({ canvasContext: canvas.getContext('2d'), viewport })
      renderTask.current.promise.catch(() => {})
      stageRef.current?.scrollTo({ top: 0 })
    })

    return () => {
      cancelled = true
    }
  }, [pdf, page, zoom])

  // Sahifa raqamini va o'qish holatini saqlash
  useEffect(() => {
    setPageInput(String(page))
    if (!user || !pdf) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase
        .from('reading_progress')
        .upsert({ user_id: user.id, book_id: id, page, total_pages: pdf.numPages, updated_at: new Date().toISOString() })
        .then(() => {})
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [page, pdf, user, id])

  useEffect(() => writePref('reader-zoom', String(zoom)), [zoom])
  useEffect(() => writePref('reader-theme', theme), [theme])

  const go = useCallback((n) => setPage((cur) => Math.min(Math.max(1, n ?? cur), total || 1)), [total])
  const next = useCallback(() => setPage((p) => Math.min(p + 1, total || 1)), [total])
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), [])

  // Klaviatura
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') next()
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev()
      else if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function zoomIn() {
    setZoom((z) => ZOOMS.find((v) => v > z + 0.001) ?? z)
  }
  function zoomOut() {
    setZoom((z) => [...ZOOMS].reverse().find((v) => v < z - 0.001) ?? z)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  async function goToDest(dest) {
    if (!pdf || !dest) return
    try {
      const explicit = typeof dest === 'string' ? await pdf.getDestination(dest) : dest
      if (!explicit) return
      const index = await pdf.getPageIndex(explicit[0])
      go(index + 1)
      if (window.innerWidth < 800) setPanel(null)
    } catch {
      // noto'g'ri havola
    }
  }

  async function search(e) {
    e.preventDefault()
    const term = query.trim().toLowerCase()
    if (!pdf || !term) return
    setResults('loading')
    const found = []
    for (let i = 1; i <= pdf.numPages && found.length < 100; i++) {
      const p = await pdf.getPage(i)
      const content = await p.getTextContent()
      const txt = content.items.map((it) => it.str).join(' ')
      const idx = txt.toLowerCase().indexOf(term)
      if (idx >= 0) {
        const start = Math.max(0, idx - 40)
        found.push({ page: i, snippet: (start > 0 ? '…' : '') + txt.slice(start, idx + term.length + 60) + '…' })
      }
    }
    setResults(found)
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return (touchStart.current = null)
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && zoom <= 1) {
      if (dx < 0) next()
      else prev()
    }
  }

  if (error) {
    return (
      <div className="center">
        <h2>{error}</h2>
        <Link to="/katalog" className="btn">Katalogga qaytish</Link>
      </div>
    )
  }

  const percent = total ? Math.round((page / total) * 100) : 0

  return (
    <div className={`reader theme-${theme}`}>
      <div className={'reader-toolbar' + (barsHidden ? ' hidden' : '')}>
        <Link to={`/kitob/${id}`} className="icon-btn" title="Orqaga">←</Link>
        <div className="reader-title">{book ? `${book.title} — ${book.author}` : 'Yuklanmoqda...'}</div>
        <div className="reader-tools">
          <button className="icon-btn" title="Mundarija" onClick={() => setPanel(panel === 'outline' ? null : 'outline')}>☰</button>
          <button className="icon-btn" title="Qidirish" onClick={() => setPanel(panel === 'search' ? null : 'search')}>🔍</button>
          <button className="icon-btn" title="Kichraytirish" onClick={zoomOut} disabled={zoom <= ZOOMS[0]}>−</button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="icon-btn" title="Kattalashtirish" onClick={zoomIn} disabled={zoom >= ZOOMS[ZOOMS.length - 1]}>+</button>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} title="Rejim">
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
            {panel === 'outline' ? (
              <>
                <h3>Mundarija</h3>
                {outline === null ? (
                  <div className="small">Yuklanmoqda...</div>
                ) : outline.length === 0 ? (
                  <div className="small">Bu kitobda mundarija yo'q.</div>
                ) : (
                  <Outline items={outline} onGo={goToDest} />
                )}
              </>
            ) : (
              <>
                <h3>Kitob ichidan qidirish</h3>
                <form onSubmit={search}>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="So'z yoki ibora" autoFocus />
                </form>
                {results === 'loading' && <div className="small" style={{ marginTop: 10 }}>Qidirilmoqda...</div>}
                {Array.isArray(results) &&
                  (results.length === 0 ? (
                    <div className="small" style={{ marginTop: 10 }}>Topilmadi.</div>
                  ) : (
                    <ul className="search-results" style={{ marginTop: 10 }}>
                      {results.map((r) => (
                        <li key={r.page}>
                          <button onClick={() => { go(r.page); if (window.innerWidth < 800) setPanel(null) }}>
                            {r.page}-bet
                            <span>{r.snippet}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ))}
              </>
            )}
          </aside>
        )}

        <div
          className="reader-stage"
          ref={stageRef}
          onDoubleClick={() => setBarsHidden((h) => !h)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {!pdf && <div style={{ padding: 40 }}>Kitob yuklanmoqda...</div>}
          <canvas ref={canvasRef} className="reader-canvas" style={{ display: pdf ? 'inline-block' : 'none' }} />
        </div>
      </div>

      <div className={'reader-footer' + (barsHidden ? ' hidden' : '')}>
        <div className="reader-progress"><div style={{ width: `${percent}%` }} /></div>
        <button className="icon-btn" onClick={prev} disabled={page <= 1} title="Oldingi sahifa">‹</button>
        <form
          className="page-jump"
          onSubmit={(e) => {
            e.preventDefault()
            const n = parseInt(pageInput, 10)
            if (!Number.isNaN(n)) go(n)
          }}
        >
          <input value={pageInput} onChange={(e) => setPageInput(e.target.value)} inputMode="numeric" />
          <span>/ {total || '…'}</span>
        </form>
        <button className="icon-btn" onClick={next} disabled={!total || page >= total} title="Keyingi sahifa">›</button>
      </div>
    </div>
  )
}
