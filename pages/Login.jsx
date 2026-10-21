import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const from = location.state?.from || '/'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  async function handleAuth(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      setBusy(false)
      if (error) return setMessage(error.message)
      if (!data.session) {
        setMessage("Ro'yxatdan o'tdingiz! Emailingizga tasdiqlash xati yuborildi, uni tasdiqlab keyin kiring.")
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      setBusy(false)
      if (error) setMessage("Email yoki parol noto'g'ri!")
    }
  }

  async function withGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + from },
    })
    if (error) setMessage(error.message)
  }

  return (
    <form className="auth-box form" onSubmit={handleAuth}>
      <h1>{isSignUp ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}</h1>
      {message && <div className="notice">{message}</div>}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label>
        Parol (kamida 6 ta belgi)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />
      </label>
      <button className="btn" disabled={busy}>
        {busy ? 'Bajarilmoqda...' : isSignUp ? "Ro'yxatdan o'tish" : 'Kirish'}
      </button>
      <button type="button" className="btn btn-outline" onClick={withGoogle}>
        Google orqali kirish
      </button>
      <button
        type="button"
        className="btn-link"
        onClick={() => {
          setIsSignUp(!isSignUp)
          setMessage('')
        }}
      >
        {isSignUp ? 'Hisobingiz bormi? Tizimga kiring' : "Akkauntingiz yo'qmi? Ro'yxatdan o'ting"}
      </button>
    </form>
  )
}
