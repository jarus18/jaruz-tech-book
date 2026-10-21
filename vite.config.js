import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // <--- Mana shu qator CSS va JS fayllar ulanishini ta'minlaydi
})
