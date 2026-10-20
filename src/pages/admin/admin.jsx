import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Admin() {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategory.trim()) return

    const { error } = await supabase.from('categories').insert([{ name: newCategory.trim() }])
    if (!error) {
      setNewCategory('')
      fetchCategories()
      alert("Kategoriya muvaffaqiyatli qo'shildi!")
    } else {
      alert("Xatolik: " + error.message)
    }
  }

  async function handleAddBook(e) {
    e.preventDefault()
    if (!file || !selectedCategory) return alert("Kategoriya va kitob faylini tanlang!")

    setBusy(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    const { error: storageError } = await supabase.storage
      .from('books_pdf')
      .upload(fileName, file)

    if (storageError) {
      setBusy(false)
      return alert("Fayl yuklashda xatolik: " + storageError.message)
    }

    const { data: publicUrlData } = supabase.storage.from('books_pdf').getPublicUrl(fileName)

    const { error: dbError } = await supabase.from('books').insert([
      {
        title,
        author,
        file_url: publicUrlData.publicUrl,
        category_id: selectedCategory
      }
    ])

    setBusy(false)
    if (!dbError) {
      setTitle('')
      setAuthor('')
      setFile(null)
      alert("Kitob muvaffaqiyatli qo'shildi!")
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #E1E5EB' }}>
      <h1 style={{ color: '#202938', marginBottom: '20px' }}>Admin Panel</h1>

      {/* Kategoriya qo'shish */}
      <section style={{ marginBottom: '30px', padding: '20px', background: '#F3F5F8', borderRadius: '8px' }}>
        <h3 style={{ color: '#202938', marginTop: 0 }}>Yangi Kategoriya (Bo'lim) yaratish</h3>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Masalan: Psixologiya"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E1E5EB' }}
            required
          />
          <button type="submit" style={{ background: '#3478F6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
            Qo'shish
          </button>
        </form>
      </section>

      {/* Kitob qo'shish */}
      <section style={{ padding: '20px', background: '#F3F5F8', borderRadius: '8px' }}>
        <h3 style={{ color: '#202938', marginTop: 0 }}>Yangi Kitob Qo'shish</h3>
        <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ color: '#202938', fontSize: '14px' }}>
            Kategoriyani tanlang:
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #E1E5EB' }}
              required
            >
              <option value="">-- Kategoriyani tanlang --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ color: '#202938', fontSize: '14px' }}>
            Kitob nomi:
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #E1E5EB' }}
              required 
            />
          </label>

          <label style={{ color: '#202938', fontSize: '14px' }}>
            Muallif:
            <input 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #E1E5EB' }}
              required 
            />
          </label>

          <label style={{ color: '#202938', fontSize: '14px' }}>
            PDF Fayl:
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files[0])} 
              style={{ display: 'block', marginTop: '5px' }}
              required 
            />
          </label>

          <button 
            type="submit" 
            disabled={busy} 
            style={{ background: '#3478F6', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {busy ? 'Yuklanmoqda...' : 'Kitobni saqlash'}
          </button>
        </form>
      </section>
    </div>
  )
}
