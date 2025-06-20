# 🚀 Refactorización de Supabase Edge Function

Eres un **desarrollador senior especializado en Supabase Edge Functions**, con experiencia avanzada en **Deno**, **TypeScript**, y principios de **Clean Code** y **KISS**.

## 📋 Contexto del Proyecto

Necesitas refactorizar una función `process-document` que:
- Recibe información de documentos subidos
- Envía datos a un webhook externo (ej. workflow de n8n)
- Gestiona el estado de procesamiento en Supabase

## 🎯 Objetivos Principales

### 1. Refactorización de Código
- Aplicar principios **KISS** y **Clean Code**
- Crear funciones modulares y desacopladas
- Mejorar la mantenibilidad y legibilidad

### 2. Enriquecimiento de Respuestas
La función debe devolver información contextual completa:

```typescript
interface ProcessResponse {
  success: boolean
  message: string
  webhookUrl: string
  payloadSent: object
  result?: any
  errorDetails?: string
}
```

### 3. Arquitectura Modular
Divide la lógica en funciones auxiliares:
- Validación de entrada
- Construcción de payload
- Llamadas a servicios externos
- Actualización de estado en DB
- Manejo de errores

## ⚙️ Especificaciones Técnicas

### Stack Tecnológico
- **Runtime**: Supabase Edge Functions (Deno)
- **SDK**: `@supabase/supabase-js@2`
- **Lenguaje**: TypeScript

### Base de Datos
- **Tabla**: `sources`
- **Campo a actualizar**: `processing_status`

### Variables de Entorno
- `DOCUMENT_PROCESSING_WEBHOOK_URL`: URL del webhook externo
- `NOTEBOOK_GENERATION_AUTH`: Token de autenticación (opcional)
- `SUPABASE_URL`: URL base de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio

### Configuración de Almacenamiento
- **Bucket público**: `sources`
- **Callback URL**: `${SUPABASE_URL}/functions/v1/process-document-callback`

## 📝 Criterios de Calidad

### Código Limpio
- Funciones con **responsabilidad única**
- Nombres descriptivos y autoexplicativos
- Comentarios que explican el **"por qué"**, no el "qué"
- Máximo 1 log por bloque funcional

### Manejo de Errores
- Captura específica de diferentes tipos de error
- Logging apropiado para monitoreo
- Respuestas de error informativas
- Actualización correcta del estado en BD

### Estructura de Respuesta
Todas las respuestas deben incluir:
- Estado de éxito/fallo
- Mensaje descriptivo
- URL del webhook utilizado
- Payload enviado (para trazabilidad)
- Resultado o detalles del error

## 🔒 Restricciones

- **NO** agregar dependencias externas
- Usar únicamente `console.log`/`console.error` para logging
- Mantener compatibilidad con Deno/Supabase Edge Functions
- Código listo para producción y testing

## 📊 Casos de Uso a Manejar

1. **Éxito completo**: Documento procesado correctamente
2. **Error de validación**: Parámetros faltantes o inválidos
3. **Error de configuración**: Variables de entorno faltantes
4. **Error de webhook**: Fallo en la llamada externa
5. **Error interno**: Excepciones no previstas

## 📤 Entrega Requerida

**IMPORTANTE**: Genera **únicamente el código TypeScript refactorizado** de la Supabase Edge Function.

### Formato de Entrega
- Código completo y funcional listo para copiar/pegar
- Sin explicaciones adicionales ni comentarios externos
- Formato directo para el **Editor de Supabase Functions**

### Instrucciones de Implementación
El código generado será:
1. **Copiado directamente** al editor de Supabase
2. **Desplegado como Edge Function** sin modificaciones adicionales
3. **Ejecutado en producción** inmediatamente

---

**Refactoriza el código adjunto siguiendo estas especificaciones y entrega SOLO la función TypeScript refactorizada, completa y lista para desplegar en Supabase.**

```ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sourceId, filePath, sourceType } = await req.json()

    if (!sourceId || !filePath || !sourceType) {
      return new Response(
        JSON.stringify({ error: 'sourceId, filePath, and sourceType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing document:', { source_id: sourceId, file_path: filePath, source_type: sourceType });

    // Get environment variables
    const webhookUrl = Deno.env.get('DOCUMENT_PROCESSING_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!webhookUrl) {
      console.error('Missing DOCUMENT_PROCESSING_WEBHOOK_URL environment variable')
      
      // Initialize Supabase client to update status
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update source status to failed
      await supabaseClient
        .from('sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId)

      return new Response(
        JSON.stringify({ error: 'Document processing webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Calling external webhook:', webhookUrl);

    // Create the file URL for public access
    const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/sources/${filePath}`

    // Prepare the payload for the webhook with correct variable names
    const payload = {
      source_id: sourceId,
      file_url: fileUrl,
      file_path: filePath,
      source_type: sourceType,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-callback`
    }

    console.log('Webhook payload:', payload);

    // Call external webhook with proper headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook call failed:', response.status, errorText);
      
      // Initialize Supabase client to update status
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update source status to failed
      await supabaseClient
        .from('sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId)

      return new Response(
        JSON.stringify({ error: 'Document processing failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Webhook response:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Document processing initiated', result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-document function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

```