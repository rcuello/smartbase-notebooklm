Actúa como un desarrollador senior experto en **React**, **TypeScript** y **arquitectura limpia**, con dominio en principios **KISS** y buenas prácticas.
Estás trabajando en una aplicación moderna llamada `smartbase-notebooklm`, que replica las funciones de Google NotebookLM usando **React + Vite + TypeScript**.

---

### 🎯 Objetivo

El hook `useDocumentProcessing.tsx` actualmente depende directamente de Supabase para invocar la función `process-document`.

Tu misión es **desacoplar completamente esa lógica**, creando un **servicio inyectable y reutilizable** que encapsule esa operación. Este refactor busca:

* Eliminar la dependencia directa de Supabase en el hook.
* Seguir el principio de inversión de dependencias.
* Facilitar el reemplazo de Supabase en el futuro (evitar vendor lock-in).
* Mejorar testabilidad y separación de responsabilidades.

---

### 📍 Instrucciones

1. **Refactorizar el hook `useDocumentProcessing.tsx`** para utilizar un servicio desacoplado.
2. **Crear un servicio reutilizable** (por ejemplo, `DocumentProcessingService`) que encapsule la invocación a `process-document`.
3. Aplicar principios de arquitectura limpia: el hook solo debe orquestar y delegar, **no contener lógica de integración**.
4. Usa nombres consistentes con el estilo del proyecto (`camelCase`, `PascalCase` donde corresponda).
5. Usar los estándares del proyecto (nombres, paths, estilo).

---

### 🧠 Contexto clave

* Proyecto: `smartbase-notebooklm`
* Framework: React + TypeScript
* Herramienta de bundling: Vite
* Supabase client actual: `@/integrations/supabase/client.ts`
* Logger: `@/services/logger`
* Notificación UI: `@/hooks/use-toast`
* Variables de entorno: `VITE_SUPABASE_BUCKET_SOURCE`
* Lógica actual a refactorizar: `frontend/src/hooks/useDocumentProcessing.tsx`
* Función invocada: `process-document`

---

### 🛠️ Estructura esperada
Debes entregar:

1. **Hook refactorizado (`useDocumentProcessing.tsx`)** desacoplado de Supabase.
2. **Servicio nuevo** (por ejemplo: `document-processing.service.ts`) que encapsula la lógica de invocación a Supabase.
3. **Interface opcional** si aplicas programación por contrato.
4. Comentarios útiles (pero no excesivos).
5. **No expliques nada. Solo devuelve el código.**
---

## Contenido del archivo useDocumentProcessing.tsx

```tsx  
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDocumentProcessing = () => {
  const { toast } = useToast();

  const processDocument = useMutation({
    mutationFn: async ({
      sourceId,
      filePath,
      sourceType
    }: {
      sourceId: string;
      filePath: string;
      sourceType: string;
    }) => {
      console.log('Initiating document processing for:', { sourceId, filePath, sourceType });

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          sourceId,
          filePath,
          sourceType
        }
      });

      if (error) {
        console.error('Document processing error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Document processing initiated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to initiate document processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start document processing. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    processDocumentAsync: processDocument.mutateAsync,
    processDocument: processDocument.mutate,
    isProcessing: processDocument.isPending,
  };
};


```


### Funcion Supabase process-document
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



### Estructura del repositorio smartbase-notebooklm:

```carpetas
frontend/
├── docs/
│   └── attachments/
│       ├── supabase-access-token.png
│       ├── supabase-account-preferences.png
│       ├── supabase-copy-paste-sql-query.png
│       ├── supabase-dashboard-check-tables.png
│       ├── supabase-migration-list.png
│       ├── supabase-migration-success.png
│       ├── supabase-migration-Y.png
│       ├── supabase-project-link-temp-folder.png
│       └── supabase-project-link.png
├── prompts/
│   ├── asistente-dev-rag.md
│   ├── refactorizador-dev.md
│   ├── refactorizador-repositorio-dev.md
│   ├── refactorizador-useDocumentProcessing.md
│   ├── refactorizador-useNotebookDelete.md
│   ├── refactorizador-useNotes.md
│   ├── refactorizador-useSources.md
│   ├── refactorizador-useSourceUpdate.md
│   └── webprodigies-ai-prompt-guide.md
├── public/
│   ├── file-types/
│   │   ├── DOC (1).png
│   │   ├── MP3 (1).png
│   │   ├── PDF (1).svg
│   │   ├── TXT (1).png
│   │   └── WEB (1).svg
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── scripts/
│   ├── check-functions.js
│   └── deploy-functions.js
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── chat/
│   │   │   ├── CitationButton.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── SourceContentViewer.tsx
│   │   │   └── SourceViewer.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── EmptyDashboard.tsx
│   │   │   ├── NotebookCard.tsx
│   │   │   └── NotebookGrid.tsx
│   │   ├── notebook/
│   │   │   ├── AddSourcesDialog.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── CopiedTextDialog.tsx
│   │   │   ├── MobileNotebookTabs.tsx
│   │   │   ├── MultipleWebsiteUrlsDialog.tsx
│   │   │   ├── NotebookHeader.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── PasteTextDialog.tsx
│   │   │   ├── RenameSourceDialog.tsx
│   │   │   ├── SaveToNoteButton.tsx
│   │   │   ├── SourcesSidebar.tsx
│   │   │   ├── StudioSidebar.tsx
│   │   │   ├── WebsiteUrlInput.tsx
│   │   │   └── YouTubeUrlInput.tsx
│   │   └── ui/
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── Logo.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   ├── constants/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAudioOverview.tsx
│   │   ├── useChatMessages.tsx
│   │   ├── useDocumentProcessing.tsx
│   │   ├── useFileUpload.tsx
│   │   ├── useIsDesktop.tsx
│   │   ├── useNotebookDelete.tsx
│   │   ├── useNotebookGeneration.tsx
│   │   ├── useNotebooks.tsx
│   │   ├── useNotebookUpdate.tsx
│   │   ├── useNotes.tsx
│   │   ├── useSourceDelete.tsx
│   │   ├── useSources.tsx
│   │   └── useSourceUpdate.tsx
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx
│   │   ├── Notebook.tsx
│   │   └── NotFound.tsx
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   ├── auth.repository.interface.ts
│   │   │   ├── note.repository.interface.ts
│   │   │   ├── notebook.repository.interface.ts
│   │   │   └── source.repository.interface.ts
│   │   ├── supabase-auth.repository.ts
│   │   ├── supabase-note.repository.ts
│   │   ├── supabase-notebook.repository.ts
│   │   └── supabase-source.repository.ts
│   ├── services/
│   │   ├── interfaces/
│   │   │   └── file-storage.interface.ts
│   │   ├── realtime/
│   │   │   └── source.realtime.manager.ts
│   │   ├── auth.factory.ts
│   │   ├── auth.service.ts
│   │   ├── authService.ts
│   │   ├── file-storage.factory.ts
│   │   ├── logger.ts
│   │   ├── note.factory.ts
│   │   ├── note.service.ts
│   │   ├── notebook.factory.ts
│   │   ├── notebook.service.ts
│   │   ├── source.factory.ts
│   │   ├── source.service.ts
│   │   └── supabase-file-storage.service.ts
│   ├── types/
│   │   ├── auth.ts
│   │   └── message.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── .temp/
│   │   ├── cli-latest
│   │   ├── gotrue-version
│   │   ├── pooler-url
│   │   ├── postgres-version
│   │   ├── project-ref
│   │   ├── rest-version
│   │   └── storage-version
│   ├── functions/
│   │   ├── audio-generation-callback/
│   │   │   └── index.ts
│   │   ├── generate-audio-overview/
│   │   │   └── index.ts
│   │   ├── generate-note-title/
│   │   │   └── index.ts
│   │   ├── generate-notebook-content/
│   │   │   └── index.ts
│   │   ├── process-additional-sources/
│   │   │   └── index.ts
│   │   ├── process-document/
│   │   │   └── index.ts
│   │   ├── process-document-callback/
│   │   │   └── index.ts
│   │   ├── refresh-audio-url/
│   │   │   └── index.ts
│   │   ├── send-chat-message/
│   │   │   └── index.ts
│   │   └── webhook-handler/
│   │       └── index.ts
│   ├── migrations/
│   │   └── 20250606152423_v0.1.sql
│   └── config.toml
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── LICENSE
├── package-lock.json
├── package.json
├── postcss.config.js
├── POSTGRES_SETUP.md
├── README.md
├── SUPABASE_SETUP.md
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

```

