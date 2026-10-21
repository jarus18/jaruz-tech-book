import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    let active = true

    async function applySession(session) {
      const u = session?.user ?? null
      if (!active) return
      setUser(u)
      if (u) {
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
        if (active) setProfile(data ?? null)
      } else {
        setProfile(null)
      }
      if (active) setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase callback ichida boshqa so'rovni darhol chaqirmaslik tavsiya etiladi
      setTimeout(() => applySession(session), 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase?.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return { user: null, profile: null, isAdmin: false, loading: false, signOut: async () => {} }
  }
  return context
}
