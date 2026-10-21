import { supabase } from './supabase'

// PDF fayllar Cloudflare R2'da saqlanadi (pdf_path "r2:" bilan boshlanadi).
// Avval Supabase Storage'ga yuklangan eski kitoblar ham ochilaveradi.
const R2_PREFIX = 'r2:'

async function callR2(body) {
  const { data, error } = await supabase.functions.invoke('r2', { body })
  if (error) {
    let message = error.message
    try {
      message = (await error.context.json()).error ?? message
    } catch {
      // javob JSON bo'lmasa, umumiy xabar qoladi
    }
    throw new Error(message)
  }
  return data
}

export async function getPdfUrl(book) {
  if (book.pdf_path.startsWith(R2_PREFIX)) {
    const { url } = await callR2({ action: 'download-url', bookId: book.id })
    return url
  }
  const { data, error } = await supabase.storage.from('books').createSignedUrl(book.pdf_path, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

// PDF'ni to'g'ridan-to'g'ri R2'ga yuklaydi, onProgress(0..100) bilan
export async function uploadPdf(bookId, file, onProgress) {
  const key = `${bookId}.pdf`
  const { url } = await callR2({ action: 'upload-url', key })
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', 'application/pdf')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`R2 yuklash xatosi: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error("R2'ga ulanib bo'lmadi (CORS sozlamasini tekshiring)"))
    xhr.send(file)
  })
  return R2_PREFIX + key
}

export async function deletePdf(pdfPath) {
  if (pdfPath.startsWith(R2_PREFIX)) await callR2({ action: 'delete', keys: [pdfPath] })
  else await supabase.storage.from('books').remove([pdfPath])
}
