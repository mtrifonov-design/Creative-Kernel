import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PRODUCTION = true;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: PRODUCTION ? '/' : '/',
})
