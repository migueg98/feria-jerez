import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// IMPORTANTE: "base" debe coincidir con el nombre del repositorio en GitHub
// para que las rutas funcionen al desplegar en GitHub Pages.
// URL final: https://migueg98.github.io/feria-jerez/
export default defineConfig({
  plugins: [react()],
  base: '/feria-jerez/',
});
