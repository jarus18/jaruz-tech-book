import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Katalog() {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [books, setBooks] = useState([])

  useEffect(() => {
    fetchCategories()
  }, [])

  // 1. Kategoriyalarni yuklash
  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  // 2. Biror kategoriya (papka) tanlanganda kitoblarni yuklash
  async function openCategory(category) {
    setActiveCategory(category)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('category_id', category.id)
    if (data) setBooks(data)
  }

  return (
    <div className="katalog-container container">
      {/* Agar papka tanlanmagan bo'lsa - barcha PAPKALARNI ko'rsatish */}
      {!activeCategory ? (
        <div>
          <h2>Kategoriyalar (Bo'limlar)</h2>
          <div className="folders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => openCategory(cat)}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f9f9f9'
                }}
              >
                <div style={{ fontSize: '40px' }}>📁</div>
                <h3>{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Agar papka tanlangan bo'lsa - kitoblarni ko'rsatish */
        <div>
          <button className="btn-link" onClick={() => setActiveCategory(null)}>
            ⬅ Orqaga (Barcha papkalar)
          </button>
          <h2>📁 {activeCategory.name} bo'limidagi kitoblar</h2>

          {books.length === 0 ? (
            <p>Ushbu bo'limda hozircha kitoblar yo'q.</p>
          ) : (
            <div className="books-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {books.map((book) => (
                <div key={book.id} className="book-card" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h3>📖 {book.title}</h3>
                  <p>Muallif: {book.author}</p>
                  <a href={book.file_url} target="_blank" rel="noreferrer" className="btn btn-small">
                    O'qish
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}