import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Katalog() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [books, setBooks] = useState([])

  useEffect(() => {
    fetchCategories()
    fetchAllBooks()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  async function fetchAllBooks() {
    setSelectedCategory(null)
    const { data } = await supabase.from('books').select('*')
    if (data) setBooks(data)
  }

  async function fetchBooksByCategory(category) {
    setSelectedCategory(category)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('category_id', category.id)
    if (data) setBooks(data)
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Kutubxona Katalogi</h2>
      
      {/* Asosiy blok: chap va o'ng qism */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* CHAP TOMON: Kategoriyalar paneli */}
        <div style={{ width: '280px', flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#1e293b' }}>📁 Bo'limlar</h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li 
              onClick={fetchAllBooks}
              style={{
                padding: '12px 15px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '8px',
                background: selectedCategory === null ? '#2563eb' : 'transparent',
                color: selectedCategory === null ? '#fff' : '#334155',
                fontWeight: selectedCategory === null ? 'bold' : 'normal',
              }}
            >
              📚 Barcha kitoblar
            </li>

            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => fetchBooksByCategory(cat)}
                style={{
                  padding: '12px 15px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: selectedCategory?.id === cat.id ? '#2563eb' : 'transparent',
                  color: selectedCategory?.id === cat.id ? '#fff' : '#334155',
                  fontWeight: selectedCategory?.id === cat.id ? 'bold' : 'normal',
                }}
              >
                📁 {cat.name}
              </li>
            ))}
          </ul>
        </div>

        {/* O'NG TOMON: Kitoblar ro'yxati */}
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>
            {selectedCategory ? `📁 ${selectedCategory.name}` : '📚 Barcha kitoblar'}
          </h3>

          {books.length === 0 ? (
            <p style={{ color: '#64748b' }}>Ushbu bo'limda hozircha kitoblar mavjud emas.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {books.map((book) => (
                <div key={book.id} style={{ border: '1px solid #e2e8f0', padding: '18px', borderRadius: '10px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📖 {book.title}</h4>
                  <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '13px' }}>Muallif: {book.author}</p>
                  <a 
                    href={book.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      display: 'inline-block', 
                      background: '#2563eb', 
                      color: '#fff', 
                      padding: '8px 16px', 
                      borderRadius: '6px', 
                      textDecoration: 'none', 
                      fontSize: '13px',
                      fontWeight: '500'
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
