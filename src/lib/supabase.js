import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)

export const supabase = isConfigured ? createClient(url, key) : null

export function coverUrl(path) {
  if (!path) return null
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
}

export const LANGUAGES = {
  uz: "O'zbekcha",
  ru: 'Ruscha',
  en: 'Inglizcha',
}

export const SHELVES = {
  reading: "O'qilyapti",
  finished: "O'qildi",
  later: "Keyinroq o'qiyman",
  favorite: 'Sevimlilar',
}
