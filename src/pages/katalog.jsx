import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Katalog() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [books, setBooks] = useState([])

  useEffect(() => {
    fetchCategories()
    fetchAllBooks() // Dastlab barcha kitoblar chiqib turishi uchun
  }, [])

  // 1. Kategoriyalarni bazadan olish
  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  // 2. Barcha kitoblarni olish
  async function fetchAllBooks() {
    setSelectedCategory(null)
    const { data } = await supabase.from('books').select('*')
    if (data) setBooks(data)
  }

  // 3. Tanlangan kategoriya bo'yicha kitoblarni olish
  async function fetchBooksByCategory(category) {
    setSelectedCategory(category)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('category_id', category.id)
    if (data) setBooks(data)
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h2>Kutubxona Katalogi</h2>
      
      {/* Asosiy qism: Chap va O'ng qismga bo'lish */}
      <div style={{ display: 'flex', gap: '25px', marginTop: '20px', alignItems: 'flex-start' }}>
        
        {/* CHAP TOMON: Kategoriyalar paneli (Sidebar) */}
        <div style={{ width: '260px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#1e293b' }}>📁 Bo'limlar</h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {/* Barcha kitoblar tugmasi */}
            <li 
              onClick={fetchAllBooks}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: '6px',
                background: selectedCategory === null ? '#2563eb' : 'transparent',
                color: selectedCategory === null ? '#fff' : '#334155',
                fontWeight: selectedCategory === null ? 'bold' : 'normal',
                transition: '0.2s'
              }}
            >
              📚 Barcha kitoblar
            </li>

            {/* Dinamik kategoriyalar */}
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => fetchBooksByCategory(cat)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  background: selectedCategory?.id === cat.id ? '#2563eb' : 'transparent',
                  color: selectedCategory?.id === cat.id ? '#fff' : '#334155',
                  fontWeight: selectedCategory?.id === cat.id ? 'bold' : 'normal',
                  transition: '0.2s'
                }}
              >
                📁 {cat.name}
              </li>
            ))}
          </ul>
        </div>

        {/* O'NG TOMON: Kitoblar ro'yxati */}
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>
            {selectedCategory ? `📁 ${selectedCategory.name}` : '📚 Barcha kitoblar'}
          </h3>

          {books.length === 0 ? (
            <p style={{ color: '#64748b' }}>Ushbu bo'limda hozircha kitoblar mavjud emas.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {books.map((book) => (
                <div key={book.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📖 {book.title}</h4>
                  <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>Muallif: {book.author}</p>
                  <a 
                    href={book.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      display: 'inline-block', 
                      background: '#2563eb', 
                      color: '#fff', 
                      padding: '6px 14px', 
                      borderRadius: '4px', 
                      textDecoration: 'none', 
                      fontSize: '13px' 
                    }}
                  >
                    O'qish
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
