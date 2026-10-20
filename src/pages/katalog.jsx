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
    <div style={{ width: '100%', minHeight: 'calc(100vh - 80px)', background: '#F3F5F8', padding: '30px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Sahifa sarlavhasi */}
        <h2 style={{ color: '#202938', fontSize: '24px', fontWeight: 'bold', marginBottom: '25px' }}>
          Kutubxona Katalogi
        </h2>
        
        {/* Asosiy qism: Chap va O'ng panel */}
        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* CHAP TOMON: Kategoriyalar paneli (Sidebar) */}
          <div style={{ width: '280px', flexShrink: 0, background: '#FFFFFF', border: '1px solid #E1E5EB', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '16px', color: '#202938', marginBottom: '15px', fontWeight: '600' }}>
              📁 Bo'limlar
            </h3>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {/* Barcha kitoblar tugmasi */}
              <li 
                onClick={fetchAllBooks}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: selectedCategory === null ? '#3478F6' : '#FFFFFF',
                  color: selectedCategory === null ? '#FFFFFF' : '#202938',
                  border: selectedCategory === null ? '1px solid #3478F6' : '1px solid #E1E5EB',
                  fontWeight: selectedCategory === null ? '600' : 'normal',
                  transition: 'all 0.2s ease',
                  fontSize: '14px'
                }}
              >
                📚 Barcha kitoblar
              </li>

              {/* Dinamik kategoriyalar (Oq fon, nozik chegara) */}
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id
                return (
                  <li
                    key={cat.id}
                    onClick={() => fetchBooksByCategory(cat)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      background: isSelected ? '#3478F6' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#202938',
                      border: isSelected ? '1px solid #3478F6' : '1px solid #E1E5EB',
                      fontWeight: isSelected ? '600' : 'normal',
                      transition: 'all 0.2s ease',
                      fontSize: '14px'
                    }}
                  >
                    📁 {cat.name}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* O'NG TOMON: Kitoblar ro'yxati */}
          <div style={{ flexGrow: 1, minWidth: '280px' }}>
            <h3 style={{ marginBottom: '20px', color: '#202938', fontSize: '18px', fontWeight: '600' }}>
              {selectedCategory ? `📁 ${selectedCategory.name}` : '📚 Barcha kitoblar'}
            </h3>

            {books.length === 0 ? (
              <p style={{ color: '#657083', fontSize: '14px' }}>Ushbu bo'limda hozircha kitoblar mavjud emas.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {books.map((book) => (
                  <div 
                    key={book.id} 
                    style={{ 
                      background: '#FFFFFF', 
                      border: '1px solid #E1E5EB', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#202938', fontWeight: '600' }}>
                        📖 {book.title}
                      </h4>
                      <p style={{ margin: '0 0 16px 0', color: '#657083', fontSize: '13px' }}>
                        Muallif: {book.author}
                      </p>
                    </div>

                    <a 
                      href={book.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        display: 'inline-block', 
                        background: '#3478F6', 
                        color: '#FFFFFF', 
                        padding: '8px 16px', 
                        borderRadius: '6px', 
                        textDecoration: 'none', 
                        fontSize: '13px',
                        fontWeight: '500',
                        textAlign: 'center'
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
    </div>
  )
}
