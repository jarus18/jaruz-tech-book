import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={location.state?.from ?? '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const { email, password, name } = form
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    setBusy(false)
    if (error) return setMessage(translateError(error.message))
    if (mode === 'signup' && !data.session) {
      setMessage("Emailingizga tasdiqlash havolasi yuborildi. Uni bosing va keyin kiring.")
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="auth-box">
      <h1>{mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}</h1>
      <form onSubmit={submit} className="form">
        {mode === 'signup' && (
          <label>
            Ismingiz
            <input value={form.name} onChange={set('name')} required />
          </label>
        )}
        <label>
          Email yoki Telefon
          <input type="text" value={form.email} onChange={set('email')} required placeholder="email@domain.com" />
        </label>
        <label>
          Parol
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? 'Kuting...' : mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
        </button>
      </form>
      {message && <div className="notice">{message}</div>}
      <p className="muted">
        {mode === 'login' ? "Akkauntingiz yo'qmi? " : 'Akkauntingiz bormi? '}
        <button className="btn-link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? "Ro'yxatdan o'ting" : 'Kiring'}
        </button>
      </p>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return "Email/Telefon yoki parol noto'g'ri."
  if (msg.includes('already registered')) return "Bu akkaunt bilan allaqachon ro'yxatdan o'tilgan."
  if (msg.includes('Email not confirmed')) return 'Avval emailingizni tasdiqlang.'
  return msg
}
