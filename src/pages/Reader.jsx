import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Reader() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBook()
  }, [id])

  async function fetchBook() {
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setBook(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: '#202938', fontFamily: 'sans-serif' }}>
        Kitob yuklanmoqda...
      </div>
    )
  }

  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: '#c62828', fontFamily: 'sans-serif' }}>
        <h2>Kitob topilmadi yoki o'chirilib yuborilgan.</h2>
        <button 
          onClick={() => navigate('/katalog')}
          style={{ marginTop: '15px', background: '#3478F6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Katalogga qaytish
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#F3F5F8', fontFamily: 'sans-serif' }}>
      {/* Yuqori boshqaruv paneli */}
      <div style={{ background: '#FFFFFF', padding: '12px 20px', borderBottom: '1px solid #E1E5EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: '1px solid #E1E5EB', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', color: '#202938', fontWeight: '500' }}
        >
          ⬅ Orqaga
        </button>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#202938', fontWeight: '600' }}>
          📖 {book.title} — <span style={{ color: '#657083', fontWeight: 'normal' }}>{book.author}</span>
        </h2>
        <a 
          href={book.file_url} 
          target="_blank" 
          rel="noreferrer"
          style={{ background: '#3478F6', color: '#FFFFFF', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
        >
          Yuklab olish
        </a>
      </div>

      {/* PDF faylni ko'rsatish oynasi */}
      <div style={{ flex: 1, width: '100%', background: '#E1E5EB' }}>
        <iframe 
          src={book.file_url} 
          title={book.title}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
