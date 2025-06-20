import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: false, // No abrir automáticamente para permitir que VS Code controle el navegador
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configuración específica para depuración
  build: {
    sourcemap: mode === 'development' ? 'inline' : false,
    minify: mode === 'development' ? false : 'esbuild',
  },
  esbuild: {
    // Mantener nombres de funciones y variables en desarrollo para mejor depuración
    keepNames: mode === 'development',
  },
  // Optimizaciones para desarrollo
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
  },
}));