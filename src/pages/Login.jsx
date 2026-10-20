import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false) // Kirish yoki Ro'yxatdan o'tish rejimi
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (isSignUp) {
      // Ro'yxatdan o'tish
      const { error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) {
        setErrorMsg(error.message)
      } else {
        alert("Ro'yxatdan muvaffaqiyatli o'tdingiz! Emailingizni tasdiqlang yoki tizimga kiring.")
        setIsSignUp(false)
      }
    } else {
      // Tizimga kirish
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setErrorMsg("Email yoki parol noto'g'ri!")
      } else {
        navigate('/') // Muvaffaqiyatli kirgach bosh sahifaga o'tkazish
      }
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 100px)', 
      background: '#F3F5F8',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        background: '#FFFFFF', 
        padding: '30px', 
        borderRadius: '16px', 
        border: '1px solid #E1E5EB',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{ color: '#202938', textAlign: 'center', marginBottom: '20px', fontWeight: '700' }}>
          {isSignUp ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
        </h2>

        {errorMsg && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', color: '#657083', fontSize: '13px', marginBottom: '5px' }}>
              Email manzil
            </label>
            <input 
              type="email" 
              placeholder="email@domain.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #E1E5EB', 
                boxSizing: 'border-box',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#657083', fontSize: '13px', marginBottom: '5px' }}>
              Parol
            </label>
            <input 
              type="password" 
              placeholder="********"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #E1E5EB', 
                boxSizing: 'border-box',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: '#3478F6', 
              color: '#FFFFFF', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '8px', 
              fontWeight: '600', 
              cursor: 'pointer',
              fontSize: '15px',
              marginTop: '10px',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Bajarilmoqda...' : (isSignUp ? "Ro'yxatdan o'tish" : "Kirish")}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#3478F6', 
              cursor: 'pointer', 
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isSignUp ? "Hisobingiz bormi? Tizimga kiring" : "Akkauntingiz yo'qmi? Ro'yxatdan o'ting"}
          </button>
        </div>
      </div>
    </div>
  )
}
