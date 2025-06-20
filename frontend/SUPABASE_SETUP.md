# 🗄️ Configuración de Supabase - SmartBase NotebookLM

Esta guía te ayudará a configurar la base de datos de Supabase y ejecutar las migraciones necesarias para el proyecto.

## 📋 Prerequisitos

- Node.js v22 o superior
- Cuenta en [Supabase](https://supabase.com)
- Proyecto de Supabase creado

## 🚀 Instalación y Configuración

### 1. Instalar Supabase CLI

⚠️ **Nota**: Usa una de estas opciones:

#### Opción A: Windows (Recomendado para tu caso)
```bash

# usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Opción B: Usar npx (Sin instalación global)
```bash
# Usar directamente con npx
npx supabase --help

# Para todos los comandos, usar npx supabase en lugar de supabase
npx supabase login
npx supabase link --project-ref tu-project-id
```

### 2. Autenticarse en Supabase

```bash
# Si instalaste con Chocolatey/Scoop
supabase login

# Si usas npx
npx supabase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Supabase.

### 3. Obtener tu Project ID

Tu Project ID se encuentra en la URL de tu proyecto:
- URL: `https://wvyrhjslhcdydsyditbl.supabase.co`
- Project ID: `wvyrhjslhcdydsyditbl`

## 3.1. Obtener tu Access token
Tu Access token se encuentra en la URL de tu proyecto:
- URL: `https://supabase.com/dashboard/account/tokens`

![alt text](docs/attachments/supabase-account-preferences.png)

![alt text](docs/attachments/supabase-access-token.png)

### 4. Configurar el archivo config.toml

Navega a `frontend/supabase/config.toml` y actualiza el `project_id`:

```toml
project_id = "wvyrhjslhcdydsyditbl"
```

### 5. Enlazar el proyecto local

```bash
cd frontend

# Si instalaste con Chocolatey/Scoop
supabase link --project-ref wvyrhjslhcdydsyditbl

# Si usas npx
npx supabase link --project-ref wvyrhjslhcdydsyditbl

# Para debuggear en caso de errores
npx supabase link --project-ref wvyrhjslhcdydsyditbl --debug
```

Si se te solicita la contraseña de la base de datos, puedes encontrarla en:
- Supabase Dashboard → Settings → Database → Connection string


![Ejecución del comando supabase link](docs/attachments/supabase-project-link.png)

![Creación de carpeta .temp](docs/attachments/supabase-project-link-temp-folder.png)

## 🔄 Ejecutar Migraciones

### Opción 1: Aplicar migraciones (Recomendado)

Ver las migraciones pendientes
```bash
# Ver las migraciones pendientes
npx supabase migration list
```

![alt text](docs/attachments/supabase-migration-list.png)

Ejecutar las migraciones pendientes

```bash
# Aplicar todas las migraciones
npx supabase db push
```
![aceptar migración](docs/attachments/supabase-migration-Y.png)

![migración exitosa](docs/attachments/supabase-migration-success.png)

![revisar tablas en supabase](docs/attachments/supabase-dashboard-check-tables.png)

### Opción 2: Reset completo de la base de datos

```bash
# ⚠️ CUIDADO: Esto borrará todos los datos existentes
npx supabase db reset
```

### Opción 3: Ejecución manual desde Dashboard

Si prefieres ejecutar las migraciones manualmente:

1. Ve a [tu proyecto en Supabase](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Abre el archivo `frontend/supabase/migrations/20250606152423_v0.1.sql`
4. Copia todo el contenido
5. Pégalo en el SQL Editor y ejecuta

![query copiada](docs/attachments/supabase-copy-paste-sql-query.png)

## ✅ Verificar la Configuración

### 1. Comprobar tablas creadas

```bash
# Conectarse a la base de datos
supabase db shell

# Listar todas las tablas
\dt

# Salir de la shell
\q
```

### 2. Verificar Edge Functions

```bash
# Listar las functions disponibles
supabase functions list

# Servir las functions localmente (desarrollo)
supabase functions serve
```

Las functions estarán disponibles en `http://localhost:54321/functions/v1/`

### 3. Probar la conexión desde el frontend

```bash
# Desde la carpeta frontend
npm run dev
```

Si todo está configurado correctamente, deberías poder:
- Registrarte/iniciar sesión
- Ver el dashboard
- Crear notebooks

## 🔧 Comandos Útiles

```bash
# Ver el estado del proyecto local
supabase status

# Ver logs en tiempo real
supabase logs

# Hacer backup de la base de datos
supabase db dump --data-only > backup.sql

# Restaurar desde backup
supabase db reset --restore backup.sql

# Generar tipos TypeScript
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## 🚨 Solución de Problemas

### Error: "Project not found"
```bash
# Verificar que estás autenticado
supabase auth whoami

# Re-enlazar el proyecto
supabase link --project-ref tu-project-id
```

### Error: "Database connection failed"
```bash
# Verificar credenciales
supabase db shell

# Si falla, obtener nueva contraseña desde Dashboard
```

### Error: "Migration already applied"
```bash
# Ver estado de migraciones
supabase migration list

# Forzar aplicación (cuidado)
supabase db push --force
```

### Functions no funcionan
```bash
# Verificar configuración local
supabase functions list

# Rebuilding functions
supabase functions deploy
```

## 📝 Variables de Entorno

Después de configurar Supabase, asegúrate de tener estas variables en tu `.env`:

```env
VITE_SUPABASE_URL=https://wvyrhjslhcdydsyditbl.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Nota**: Puedes encontrar tu `ANON_KEY` en Supabase Dashboard → Settings → API

## 🎯 Próximos Pasos

1. ✅ Configurar Supabase y ejecutar migraciones
2. ✅ Configurar variables de entorno
3. 🔄 Configurar workflows de n8n (ver `/backend/README.md`)
4. 🚀 Ejecutar la aplicación completa

---

**¿Necesitas ayuda?** Consulta la [documentación oficial de Supabase](https://supabase.com/docs) o abre un issue en el repositorio.

https://supabase.com/docs/reference/cli/supabase-init