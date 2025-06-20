Actúa como un desarrollador senior experto en **React**, **TypeScript** y **arquitectura limpia**, con dominio en principios **KISS** y buenas prácticas.
Estás trabajando en una aplicación moderna llamada `smartbase-notebooklm`, que replica las funciones de Google NotebookLM usando **React + Vite + TypeScript**.

---

### 🎯 Objetivo

Desacopla completamente el uso de **Supabase** en la lógica de subida de archivos implementada en `useNotes.tsx`, reemplazando la lógica directa por un **servicio o repositorio inyectable y reutilizable**.
Esto permitirá sustituir fácilmente Supabase por otros mecanismos de almacenamiento en el futuro y **evitar vendor lock-in**.

---

### 📍 Instrucciones

* **No expliques nada. Solo devuelve el código necesario.**
* Refactoriza el código en `useNotes.tsx` para **eliminar la dependencia directa de Supabase**.
* Crea o modifica repositorios ,servicios  reutilizables que encapsule la lógica actual crear,editar,eliminar (donde aplique).
* Aplica buenas prácticas, separación de responsabilidades y principios KISS.
* **Es válido agregar comentarios en el código donde sea necesario** para mejorar su comprensión y mantenibilidad.
* Usa nombres consistentes con el estilo del proyecto (`camelCase`, `PascalCase` donde corresponda).

---

### 🧠 Contexto clave

* Proyecto: `smartbase-notebooklm`
* Framework: React + TypeScript
* Herramienta de bundling: Vite
* Lógica actual acoplada a Supabase en: `frontend/src/hooks/useNotes.tsx`
* Supabase client actual: `@/integrations/supabase/client.ts`
* Logger: `@/services/logger`
* Notificación UI: `@/hooks/use-toast`
* Variables de entorno: `VITE_SUPABASE_BUCKET_SOURCE`

---

### 🛠️ Estructura esperada

1. **Nuevo repositorio desacoplado** (por ejemplo `supabase-note.repository.ts`)
1. **Nuevo servicio desacoplado** (por ejemplo `note.service.ts`)
2. **Clase de fábrica para crear instancias de servicio de note con sus dependencias** (por ejemplo `note.factory.ts`)
3. **Refactor del hook `useNotes.tsx`** para usar el nuevo servicio
---

## Contenido del archivo useNotes.tsx

```tsx  
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Note {
  id: string;
  notebook_id: string;
  title: string;
  content: string;
  source_type: 'user' | 'ai_response';
  extracted_text?: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', notebookId],
    queryFn: async () => {
      if (!notebookId) return [];
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!notebookId && !!user,
  });

  const createNoteMutation = useMutation({
    mutationFn: async ({ 
      title, 
      content, 
      source_type = 'user',
      extracted_text 
    }: { 
      title: string; 
      content: string; 
      source_type?: 'user' | 'ai_response';
      extracted_text?: string;
    }) => {
      if (!notebookId) throw new Error('Notebook ID is required');
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          notebook_id: notebookId,
          title,
          content,
          source_type,
          extracted_text,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  return {
    notes,
    isLoading,
    createNote: createNoteMutation.mutate,
    isCreating: createNoteMutation.isPending,
    updateNote: updateNoteMutation.mutate,
    isUpdating: updateNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutate,
    isDeleting: deleteNoteMutation.isPending,
  };
};




### Estructura del proyecto:

```carpetas
smartbase-notebooklm/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── frontend/
│   ├── public/
│   │   ├── file-types/
│   │   │   ├── DOC (1).png
│   │   │   ├── MP3 (1).png
│   │   │   ├── PDF (1).svg
│   │   │   ├── TXT (1).png
│   │   │   └── WEB (1).svg
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── scripts/
│   │   ├── check-functions.js
│   │   └── deploy-functions.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── AuthForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── chat/
│   │   │   │   ├── CitationButton.tsx
│   │   │   │   ├── MarkdownRenderer.tsx
│   │   │   │   ├── SourceContentViewer.tsx
│   │   │   │   └── SourceViewer.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHeader.tsx
│   │   │   │   ├── EmptyDashboard.tsx
│   │   │   │   ├── NotebookCard.tsx
│   │   │   │   └── NotebookGrid.tsx
│   │   │   ├── notebook/
│   │   │   │   ├── AddSourcesDialog.tsx
│   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   ├── ChatArea.tsx
│   │   │   │   ├── CopiedTextDialog.tsx
│   │   │   │   ├── MobileNotebookTabs.tsx
│   │   │   │   ├── MultipleWebsiteUrlsDialog.tsx
│   │   │   │   ├── NotebookHeader.tsx
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   ├── PasteTextDialog.tsx
│   │   │   │   ├── RenameSourceDialog.tsx
│   │   │   │   ├── SaveToNoteButton.tsx
│   │   │   │   ├── SourcesSidebar.tsx
│   │   │   │   ├── StudioSidebar.tsx
│   │   │   │   ├── WebsiteUrlInput.tsx
│   │   │   │   └── YouTubeUrlInput.tsx
│   │   │   └── ui/
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── aspect-ratio.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── carousel.tsx
│   │   │       ├── chart.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── command.tsx
│   │   │       ├── context-menu.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── Logo.tsx
│   │   │       ├── menubar.tsx
│   │   │       ├── navigation-menu.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── resizable.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       ├── toggle-group.tsx
│   │   │       ├── toggle.tsx
│   │   │       ├── tooltip.tsx
│   │   │       └── use-toast.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   ├── useAudioOverview.tsx
│   │   │   ├── useChatMessages.tsx
│   │   │   ├── useDocumentProcessing.tsx
│   │   │   ├── useFileUpload.tsx
│   │   │   ├── useIsDesktop.tsx
│   │   │   ├── useNotebookDelete.tsx
│   │   │   ├── useNotebookGeneration.tsx
│   │   │   ├── useNotebooks.tsx
│   │   │   ├── useNotebookUpdate.tsx
│   │   │   ├── useNotes.tsx
│   │   │   ├── useSourceDelete.tsx
│   │   │   ├── useSources.tsx
│   │   │   └── useSourceUpdate.tsx
│   │   ├── integrations/
│   │   │   └── supabase/
│   │   │       ├── client.ts
│   │   │       └── types.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Auth.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Index.tsx
│   │   │   ├── Notebook.tsx
│   │   │   └── NotFound.tsx
│   │   ├── repositories/
│   │   │   ├── interfaces/
│   │   │   │   ├── auth.repository.interface.ts
│   │   │   │   └── notebook.repository.interface.ts
│   │   │   ├── supabase-auth.repository.ts
│   │   │   └── supabase-notebook.repository.ts
│   │   ├── services/
│   │   │   ├── interfaces/
│   │   │   │   └── fileStorage.interface.ts
│   │   │   ├── auth.factory.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── authService.ts
│   │   │   ├── fileStorage.factory.ts
│   │   │   ├── logger.ts
│   │   │   ├── notebook.factory.ts
│   │   │   ├── notebook.service.ts
│   │   │   └── supabaseFileStorage.service.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   └── message.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── supabase/
│   │   ├── .temp/
│   │   │   ├── cli-latest
│   │   │   ├── gotrue-version
│   │   │   ├── pooler-url
│   │   │   ├── postgres-version
│   │   │   ├── project-ref
│   │   │   ├── rest-version
│   │   │   └── storage-version
│   │   ├── functions/
│   │   │   ├── audio-generation-callback/
│   │   │   │   └── index.ts
│   │   │   ├── generate-audio-overview/
│   │   │   │   └── index.ts
│   │   │   ├── generate-note-title/
│   │   │   │   └── index.ts
│   │   │   ├── generate-notebook-content/
│   │   │   │   └── index.ts
│   │   │   ├── process-additional-sources/
│   │   │   │   └── index.ts
│   │   │   ├── process-document/
│   │   │   │   └── index.ts
│   │   │   ├── process-document-callback/
│   │   │   │   └── index.ts
│   │   │   ├── refresh-audio-url/
│   │   │   │   └── index.ts
│   │   │   ├── send-chat-message/
│   │   │   │   └── index.ts
│   │   │   └── webhook-handler/
│   │   │       └── index.ts
│   │   ├── migrations/
│   │   │   └── 20250606152423_v0.1.sql
│   │   └── config.toml
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── LICENSE
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── POSTGRES_SETUP.md
│   ├── README.md
│   ├── SUPABASE_SETUP.md
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── realtime-events-backend/
│   ├── frontend/
│   │   └── ws-client.html
│   ├── src/
│   │   ├── consumers/
│   │   ├── publishers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── event.service.ts
│   │   │   └── rabbitmq.service.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── package.json
│   ├── README.md
│   └── tsconfig.json
└── README.md
```

