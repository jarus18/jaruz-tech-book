import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [books, setBooks] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [notice, setNotice] = useState('')

  // Admin huquqini yoki oddiy kirishni tekshirish
  useEffect(() => {
    if (!user) {
      navigate('/kirish')
      return
    }
    fetchData()
  }, [user, navigate])

  async function fetchData() {
    // Kategoriyalarni olish
    const { data: catData } = await supabase.from('categories').select('*').order('name')
    if (catData) setCategories(catData)

    // Kitoblarni olish
    const { data: bookData } = await supabase.from('books').select('*').order('created_at', { ascending: false })
    if (bookData) setBooks(bookData)
  }

  // Yangi kategoriya qo'shish
  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim() })
    if (error) {
      setNotice('Xatolik: ' + error.message)
    } else {
      setNewCategoryName('')
      setNotice('Kategoriya muvaffaqiyatli qo\'shildi!')
      fetchData()
    }
  }

  // Kategoriyani o'chirish
  async function handleDeleteCategory(id) {
    if (!window.confirm('Haqiqatan ham bu kategoriyani o\'chirmoqchimisiz?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      setNotice('O\'chirishda xatolik: ' + error.message)
    } else {
      setNotice('Kategoriya o\'chirildi.')
      fetchData()
    }
  }

  return (
    <div className="admin-page" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Admin Panel</h1>
      {notice && <div className="notice" style={{ margin: '10px 0', color: '#3478F6' }}>{notice}</div>}

      {/* Kategoriyalar boshqaruvi */}
      <section style={{ marginBottom: '30px', background: '#F3F5F8', padding: '20px', borderRadius: '8px' }}>
        <h2>Kategoriyalar (Papka) boshqaruvi</h2>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Yangi kategoriya nomi"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #E1E5EB' }}
          />
          <button type="submit" className="btn" style={{ padding: '8px 16px', background: '#3478F6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Qo'shish
          </button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
          {categories.map((cat) => (
            <li key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #E1E5EB' }}>
              <span>{cat.name}</span>
              <button 
                onClick={() => handleDeleteCategory(cat.id)}
                style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                O'chirish
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Kitoblar ro'yxati */}
      <section style={{ background: '#F3F5F8', padding: '20px', borderRadius: '8px' }}>
        <h2>Kitoblar ro'yxati ({books.length} ta)</h2>
        <div style={{ marginTop: '10px' }}>
          {books.map((b) => (
            <div key={b.id} style={{ background: '#fff', padding: '10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #E1E5EB' }}>
              <strong>{b.title}</strong> — <span style={{ color: '#657083' }}>{b.author}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
