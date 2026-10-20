import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // Kitob kiritish formasi xossalari
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  // Kategoriyalarni bazadan olish
  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  // Yangi kategoriya yaratish (Admin)
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

  // Yangi kitob qo'shish
  async function handleAddBook(e) {
    e.preventDefault()
    if (!file || !selectedCategory) return alert("Kategoriya va kitob faylini tanlang!")

    setBusy(true)
    // 1. PDF faylni Supabase Storage'ga yuklash
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { data: storageData, error: storageError } = await supabase.storage
      .from('books_pdf')
      .upload(fileName, file)

    if (storageError) {
      setBusy(false)
      return alert("Fayl yuklashda xatolik: " + storageError.message)
    }

    // Fayl havolasini olish
    const { data: publicUrlData } = supabase.storage.from('books_pdf').getPublicUrl(fileName)

    // 2. Kitob ma'lumotlarini bazaga saqlash
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
    <div className="admin-page container">
      <h1>Admin Panel</h1>

      {/* 1. Yangi Kategoriya qo'shish qismi */}
      <section className="card">
        <h2>Yangi Kategoriya (Bo'lim) yaratish</h2>
        <form onSubmit={handleAddCategory} className="form-inline">
          <input
            type="text"
            placeholder="Masalan: Psixologiya"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          />
          <button className="btn">Kategoriya qo'shish</button>
        </form>
      </section>

      <hr />

      {/* 2. Kitob qo'shish qismi */}
      <section className="card">
        <h2>Yangi Kitob Qo'shish</h2>
        <form onSubmit={handleAddBook} className="form">
          <label>
            Kategoriyani tanlang:
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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

          <label>
            Kitob nomi:
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label>
            Muallif:
            <input value={author} onChange={(e) => setAuthor(e.target.value)} required />
          </label>

          <label>
            PDF Fayl:
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} required />
          </label>

          <button className="btn" disabled={busy}>
            {busy ? 'Yuklanmoqda...' : 'Kitobni saqlash'}
          </button>
        </form>
      </section>
    </div>
  )
}