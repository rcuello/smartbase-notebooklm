# Frontend - SmartBase NotebookLM

Una aplicación web moderna construida con React, TypeScript y Vite que replica las funcionalidades de NotebookLM de Google. Esta interfaz permite a los usuarios crear notebooks inteligentes, procesar múltiples fuentes de información y generar contenido con IA.

## 🚀 Características Principales

- **Autenticación Segura**: Sistema de autenticación completo con Supabase Auth
- **Dashboard Intuitivo**: Gestión visual de notebooks con tarjetas interactivas
- **Chat con IA**: Interfaz conversacional para interactuar con el contenido de tus fuentes
- **Procesamiento Multi-formato**: Soporte para documentos PDF, TXT, DOC, MP3 y URLs web
- **Generación de Audio**: Creación automática de podcasts y resúmenes en audio
- **Editor de Notas**: Sistema de notas integrado con guardado automático
- **Responsive Design**: Optimizado para dispositivos móviles y desktop

## 🛠️ Stack Tecnológico

- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite 5
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS con animaciones
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL)
- **Automation**: Integración con n8n workflows

## 📋 Prerequisitos

- Node.js v22 o superior
- npm, yarn o bun
- Cuenta de Supabase
- Instancia de n8n configurada

## 🔧 Instalación

1. **Clonar el repositorio y navegar al frontend**
   ```bash
   cd smartbase-notebooklm/frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o usando bun
   bun install
   ```

3. **Configurar Supabase y ejecutar migraciones**
   
   Antes de configurar las variables de entorno, necesitas configurar la base de datos:
   ```bash
   # Ver la guía completa de configuración
   # Consulta: SUPABASE_SETUP.md
   ```
   
4. **Configurar variables de entorno**
   
   Copia el archivo de ejemplo y configura las variables:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus credenciales:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:5173`

## 📜 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run build:dev` - Construye en modo desarrollo
- `npm run lint` - Ejecuta el linter de código
- `npm run preview` - Previsualiza la build de producción

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Componentes de autenticación
│   ├── chat/           # Sistema de chat con IA
│   ├── dashboard/      # Interfaz del dashboard
│   ├── notebook/       # Funcionalidades del notebook
│   └── ui/             # Componentes base de shadcn/ui
├── contexts/           # Contextos de React
├── hooks/              # Custom hooks
├── integrations/       # Integraciones externas (Supabase)
├── lib/                # Utilidades y helpers
├── pages/              # Páginas principales
├── services/           # Servicios de API
└── types/              # Definiciones de TypeScript
```

## 🔌 Integraciones

### Supabase
- **Base de datos**: PostgreSQL para almacenamiento de notebooks, fuentes y mensajes
- **Autenticación**: Sistema completo de auth con sesiones
- **Edge Functions**: Procesamiento serverless de documentos y generación de contenido
- **Storage**: Almacenamiento de archivos subidos

### n8n Workflows
El frontend se comunica con workflows de n8n para:
- Extracción de texto de documentos
- Procesamiento de fuentes adicionales
- Generación de contenido de notebooks
- Creación de podcasts y audio
- Gestión del vector store para embeddings

## 🎨 Componentes Principales

### Dashboard
- **NotebookGrid**: Cuadrícula de notebooks con lazy loading
- **NotebookCard**: Tarjeta individual con preview y acciones
- **EmptyDashboard**: Estado vacío con onboarding

### Notebook
- **ChatArea**: Interface de chat con historial de mensajes
- **SourcesSidebar**: Gestión de fuentes con drag & drop
- **StudioSidebar**: Panel de control del notebook
- **AudioPlayer**: Reproductor integrado para podcasts generados

### Chat
- **MarkdownRenderer**: Renderizado avanzado de markdown con sintaxis
- **CitationButton**: Sistema de citaciones con referencias
- **SourceViewer**: Visualización de contenido de fuentes

## 🔒 Autenticación

El sistema utiliza Supabase Auth con:
- Registro y login con email/contraseña
- Protección de rutas con `ProtectedRoute`
- Manejo automático de sesiones
- Contexto global de autenticación

## 📱 Responsive Design

- **Desktop**: Layout de 3 columnas con sidebars
- **Tablet**: Layout adaptativo con navigation tabs
- **Mobile**: Interface optimizada con drawer navigation

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. **Configuración de Supabase**: Consulta `SUPABASE_SETUP.md` para la configuración detallada de la base de datos
2. **Arquitectura general**: Revisa la documentación en `/arquitecture/README.md`
3. **Workflows de n8n**: Consulta los workflows en `/backend/README.md`
4. **Issues del proyecto**: Abre un issue en el repositorio

---

**Nota**: Este frontend está diseñado para trabajar en conjunto con los workflows de n8n y la base de datos de Supabase. Asegúrate de tener ambos servicios configurados correctamente.