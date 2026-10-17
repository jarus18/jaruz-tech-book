// Cloudflare R2 bilan ishlovchi server funksiyasi (Supabase Edge Function).
// Brauzer R2 kalitini ko'rmaydi: bu funksiya faqat vaqtinchalik imzolangan havolalar beradi.
//
// Kerakli maxfiy qiymatlar (Edge Functions -> Secrets):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET

import { createClient } from 'npm:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch@1.0.20'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')
const BUCKET = Deno.env.get('R2_BUCKET')
const r2 = new AwsClient({
  accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
  secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
  service: 's3',
  region: 'auto',
})

function objectUrl(key: string) {
  const safeKey = key.split('/').map(encodeURIComponent).join('/')
  return `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${safeKey}`
}

async function presign(method: 'GET' | 'PUT', key: string, expires: number) {
  const url = new URL(objectUrl(key))
  url.searchParams.set('X-Amz-Expires', String(expires))
  const signed = await r2.sign(new Request(url, { method }), { aws: { signQuery: true } })
  return signed.url
}

// Faqat oddiy fayl nomlari: "abc-123.pdf"
const KEY_RE = /^[A-Za-z0-9_-]+\.pdf$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!ACCOUNT_ID || !BUCKET) return json({ error: "R2 sozlanmagan: Secrets bo'limini to'ldiring" }, 500)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return json({ error: 'Avval tizimga kiring' }, 401)

  let body: { action?: string; key?: string; bookId?: string; keys?: string[] }
  try {
    body = await req.json()
  } catch {
    return json({ error: "So'rov noto'g'ri" }, 400)
  }

  // Kitobni o'qish: foydalanuvchi ko'ra oladigan kitob bo'lsa, 1 soatlik havola beriladi
  if (body.action === 'download-url') {
    const { data: book } = await supabase.from('books').select('pdf_path').eq('id', body.bookId).maybeSingle()
    if (!book) return json({ error: 'Kitob topilmadi' }, 404)
    const key = book.pdf_path.replace(/^r2:/, '')
    return json({ url: await presign('GET', key, 60 * 60) })
  }

  // Quyidagilar faqat admin uchun
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return json({ error: 'Faqat admin uchun' }, 403)

  if (body.action === 'upload-url') {
    if (!body.key || !KEY_RE.test(body.key)) return json({ error: "Fayl nomi noto'g'ri" }, 400)
    return json({ url: await presign('PUT', body.key, 60 * 30) })
  }

  if (body.action === 'delete') {
    const keys = (body.keys ?? []).map((k) => k.replace(/^r2:/, '')).filter((k) => KEY_RE.test(k))
    for (const key of keys) {
      const res = await r2.fetch(objectUrl(key), { method: 'DELETE' })
      if (!res.ok && res.status !== 404) return json({ error: `O'chirib bo'lmadi: ${res.status}` }, 502)
    }
    return json({ deleted: keys.length })
  }

  return json({ error: "Noma'lum amal" }, 400)
})
