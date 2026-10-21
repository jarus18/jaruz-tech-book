import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Veb va Electron uchun birdek ishlashini ta'minlaydi
})
