import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base precisa ser "/NOME-DO-REPOSITORIO/" para GitHub Pages.
// Em Vercel ou Netlify, deixe "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/amas-demonstrador/',
})
