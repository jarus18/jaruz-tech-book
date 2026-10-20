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

  // 1. Kategoriyalarni bazadan olish
  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  // 2. Barcha kitoblarni yuklash
  async function fetchAllBooks() {
    setSelectedCategory(null)
    const { data } = await supabase.from('books').select('*')
    if (data) setBooks(data)
  }

  // 3. Tanlangan kategoriya bo'yicha kitoblarni yuklash
  async function fetchBooksByCategory(category) {
    setSelectedCategory(category)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('category_id', category.id)
    if (data) setBooks(data)
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#F3F5F8', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      {/* ASOSIY KONTENT QISMI */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
          
          {/* CHAP TOMON: Kategoriyalar paneli (Sidebar) */}
          <div style={{ 
            width: '260px', 
            flexShrink: 0, 
            background: '#FFFFFF', 
            borderRadius: '16px', 
            padding: '24px 18px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid #E1E5EB'
          }}>
            <h3 style={{ fontSize: '20px', color: '#202938', margin: '0 0 20px 8px', fontWeight: '700' }}>
              Kategoriyalar
            </h3>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {/* Barcha kitoblar */}
              <li 
                onClick={fetchAllBooks}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  background: selectedCategory === null ? '#1677FF' : 'transparent',
                  color: selectedCategory === null ? '#FFFFFF' : '#202938',
                  fontWeight: selectedCategory === null ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>📚</span> Barcha kitoblar
              </li>

              {/* Dinamik kategoriyalar */}
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id
                return (
                  <li
                    key={cat.id}
                    onClick={() => fetchBooksByCategory(cat)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      background: isSelected ? '#1677FF' : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#202938',
                      fontWeight: isSelected ? '600' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '15px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Ψ</span> {cat.name}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* O'NG TOMON: Kitoblar katakchasi (Grid) */}
          <div style={{ flexGrow: 1 }}>
            
            {/* Bo'lim sarlavhasi */}
            <h2 style={{ fontSize: '24px', color: '#202938', margin: '0 0 20px 0', fontWeight: '700' }}>
              Katalog: {selectedCategory ? selectedCategory.name : 'Barcha kitoblar'}
            </h2>

            {books.length === 0 ? (
              <p style={{ color: '#657083', fontSize: '15px', marginTop: '20px' }}>
                Ushbu bo'limda hozircha kitoblar mavjud emas.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px' }}>
                {books.map((book) => (
                  <div 
                    key={book.id} 
                    style={{ 
                      background: '#FFFFFF', 
                      borderRadius: '16px', 
                      padding: '20px 16px', 
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                      border: '1px solid #E1E5EB',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* Kitob muqovasi (rasm yoki standart ramka) */}
                    <div style={{ 
                      width: '90px', 
                      height: '120px', 
                      background: '#F3F5F8', 
                      borderRadius: '8px', 
                      marginBottom: '15px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '32px' }}>📖</div>
                      )}
                    </div>

                    {/* Kitob nomi va muallif */}
                    <div style={{ width: '100%', marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#202938', fontWeight: '700', lineHeight: '1.3' }}>
                        {book.title}
                      </h4>
                      <p style={{ margin: 0, color: '#657083', fontSize: '13px' }}>
                        {book.author}
                      </p>
                    </div>

                    {/* O'qish tugmasi */}
                    <a 
                      href={book.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        width: '100%',
                        background: '#1677FF', 
                        color: '#FFFFFF', 
                        padding: '10px 0', 
                        borderRadius: '10px', 
                        textDecoration: 'none', 
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'block',
                        boxSizing: 'border-box'
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
