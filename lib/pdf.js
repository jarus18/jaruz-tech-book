import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjsLib }

// PDF faylning birinchi sahifasidan muqova rasmi (JPEG) va sahifalar sonini oladi
export async function readPdfInfo(file) {
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const page = await pdf.getPage(1)
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: 600 / base.width })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  const cover = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  const meta = await pdf.getMetadata().catch(() => null)
  const info = { pages: pdf.numPages, cover, title: meta?.info?.Title || '', author: meta?.info?.Author || '' }
  pdf.destroy()
  return info
}
