# 🐳 PostgreSQL Local con Docker - SmartBase NotebookLM

Esta guía te permitirá configurar una base de datos PostgreSQL local usando Docker como alternativa al setup de Supabase, ideal para desarrollo local sin dependencias externas.

## 🎯 ¿Cuándo usar esta opción?

- **Desarrollo offline**: Trabajar sin conexión a internet
- **Testing local**: Pruebas rápidas sin afectar datos de producción
- **Control total**: Configuración personalizada de la base de datos
- **Problemas con Supabase CLI**: Alternativa cuando hay issues de conectividad

## 📋 Prerequisitos

- Docker Desktop instalado y ejecutándose
- Node.js v22 o superior
- Cliente PostgreSQL (opcional, para administración)

## 🚀 Configuración Inicial

### 1. Crear archivo docker-compose.yml

Crea un archivo `docker-compose.yml` en la carpeta `frontend/`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: smartbase-postgres
    environment:
      POSTGRES_DB: smartbase_db
      POSTGRES_USER: smartbase_user
      POSTGRES_PASSWORD: smartbase_password
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    networks:
      - smartbase_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: smartbase-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@smartbase.com
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "8080:80"
    depends_on:
      - postgres
    networks:
      - smartbase_network

volumes:
  postgres_data:

networks:
  smartbase_network:
    driver: bridge
```

### 2. Configurar variables de entorno para desarrollo local

Crea un archivo `.env.local`:

```env
# Base de datos local
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=local-development-key
VITE_DATABASE_URL=postgresql://smartbase_user:smartbase_password@localhost:5432/smartbase_db

# Configuración de desarrollo
NODE_ENV=development
VITE_ENV=local
```

### 3. Iniciar los servicios

```bash
cd frontend

# Iniciar PostgreSQL y pgAdmin
docker-compose up -d

# Verificar que los servicios están corriendo
docker-compose ps
```

## 📊 Acceso a los Servicios

### PostgreSQL
- **Host**: `localhost`
- **Puerto**: `5432`
- **Base de datos**: `smartbase_db`
- **Usuario**: `smartbase_user`
- **Contraseña**: `smartbase_password`

### pgAdmin (Interfaz Web)
- **URL**: http://localhost:8080
- **Email**: `admin@smartbase.com`
- **Contraseña**: `admin123`

## 🔄 Ejecutar Migraciones

### Opción 1: Automática con Docker (Recomendado)

Las migraciones se ejecutan automáticamente al iniciar el contenedor gracias al volumen:
```yaml
- ./supabase/migrations:/docker-entrypoint-initdb.d
```

### Opción 2: Manual con psql

```bash
# Conectarse a la base de datos
docker exec -it smartbase-postgres psql -U smartbase_user -d smartbase_db

# Ejecutar migración manualmente
\i /docker-entrypoint-initdb.d/20250606152423_v0.1.sql

# Salir
\q
```

### Opción 3: Usando cliente externo

```bash
# Con psql local instalado
psql -h localhost -p 5432 -U smartbase_user -d smartbase_db -f supabase/migrations/20250606152423_v0.1.sql

# Con herramientas como DBeaver, DataGrip, etc.
```

## 🛠️ Comandos Útiles

### Gestión de contenedores
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Parar servicios
docker-compose down

# Parar y eliminar datos
docker-compose down -v

# Reiniciar solo PostgreSQL
docker-compose restart postgres
```

### Backup y Restore
```bash
# Crear backup
docker exec smartbase-postgres pg_dump -U smartbase_user smartbase_db > backup.sql

# Restaurar backup
docker exec -i smartbase-postgres psql -U smartbase_user -d smartbase_db < backup.sql

# Backup con docker-compose
docker-compose exec postgres pg_dump -U smartbase_user smartbase_db > backup.sql
```

### Acceso directo a la base de datos
```bash
# Conectarse via docker
docker exec -it smartbase-postgres psql -U smartbase_user -d smartbase_db

# Comandos útiles dentro de psql
\dt          # Listar tablas
\d tabla     # Describir tabla
\l           # Listar bases de datos
\q           # Salir
```

## 🔧 Configuración del Frontend

### 1. Actualizar configuración de cliente

Crea un archivo `src/integrations/supabase/local-client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3000'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-development-key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
})
```

### 2. Configurar proxy en Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5432',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
```

## 🎛️ Scripts de desarrollo

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:local": "vite --mode local",
    "db:start": "docker-compose up -d postgres",
    "db:stop": "docker-compose down",
    "db:reset": "docker-compose down -v && docker-compose up -d postgres",
    "db:shell": "docker exec -it smartbase-postgres psql -U smartbase_user -d smartbase_db",
    "db:backup": "docker exec smartbase-postgres pg_dump -U smartbase_user smartbase_db > backup-$(date +%Y%m%d-%H%M%S).sql",
    "pgadmin": "docker-compose up -d pgadmin"
  }
}
```

## 🔍 Verificación y Testing

### 1. Verificar conexión
```bash
# Probar conexión a PostgreSQL
npm run db:shell

# En psql, verificar tablas
\dt
```

### 2. Probar la aplicación
```bash
# Iniciar base de datos
npm run db:start

# Iniciar aplicación en modo local
npm run dev:local
```

### 3. Poblar datos de prueba

Crea un archivo `scripts/seed-data.sql`:

```sql
-- Insertar datos de prueba
INSERT INTO notebooks (id, title, description, created_at) 
VALUES 
  ('test-1', 'Notebook de Prueba', 'Descripción de prueba', NOW()),
  ('test-2', 'Segundo Notebook', 'Otra descripción', NOW());

INSERT INTO sources (id, notebook_id, title, type, content) 
VALUES 
  ('source-1', 'test-1', 'Documento de prueba', 'pdf', 'Contenido de ejemplo'),
  ('source-2', 'test-1', 'URL de prueba', 'url', 'https://example.com');
```

```bash
# Ejecutar datos de prueba
docker exec -i smartbase-postgres psql -U smartbase_user -d smartbase_db < scripts/seed-data.sql
```

## 🚨 Solución de Problemas

### PostgreSQL no inicia
```bash
# Verificar logs
docker-compose logs postgres

# Verificar puertos ocupados
netstat -an | grep 5432

# Cambiar puerto si está ocupado (en docker-compose.yml)
ports:
  - "5433:5432"  # Usar puerto 5433 en lugar de 5432
```

### Problemas de permisos
```bash
# Reiniciar con volúmenes limpios
docker-compose down -v
docker volume prune
docker-compose up -d
```

### Conexión desde la aplicación falla
```bash
# Verificar variables de entorno
echo $VITE_DATABASE_URL

# Probar conexión directa
telnet localhost 5432
```

## 🔄 Migración a Producción

Cuando quieras migrar de desarrollo local a Supabase:

1. **Exportar datos**:
```bash
npm run db:backup
```

2. **Configurar Supabase** (ver `SUPABASE_SETUP.md`)

3. **Cambiar variables de entorno**:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

4. **Importar datos** a Supabase si es necesario

## 📚 Recursos Adicionales

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4/)
