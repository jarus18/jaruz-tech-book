import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    // Agar Electron uchun build qilinsa './' ishlatiladi, veb uchun '/'
    base: process.env.ELECTRON === 'true' ? './' : '/',
  }
})
