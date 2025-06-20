Actúa como un desarrollador senior experto en **React**, **TypeScript** y **arquitectura limpia**, con dominio en principios **KISS** y buenas prácticas.
Estás trabajando en una aplicación moderna llamada `smartbase-notebooklm`, que replica las funciones de Google NotebookLM usando **React + Vite + TypeScript**.

---

### 🎯 Objetivo

Desacopla completamente el uso de **Supabase** en la lógica de subida de archivos implementada en `useSources.tsx`, reemplazando la lógica directa por un **servicio o repositorio inyectable y reutilizable**.
Esto permitirá sustituir fácilmente Supabase por otros mecanismos de almacenamiento en el futuro y **evitar vendor lock-in**.

---

### 📍 Instrucciones

* **No expliques nada. Solo devuelve el código necesario.**
* Refactoriza el código en `useSources.tsx` para **eliminar la dependencia directa de Supabase**.
* Crea o modifica repositorios ,servicios  reutilizables que encapsule la lógica actual crear,editar,eliminar (donde aplique).
* Aplica buenas prácticas, separación de responsabilidades y principios KISS.
* **Es válido agregar comentarios en el código donde sea necesario** para mejorar su comprensión y mantenibilidad.
* Usa nombres consistentes con el estilo del proyecto (`camelCase`, `PascalCase` donde corresponda).

---

### 🧠 Contexto clave

* Proyecto: `smartbase-notebooklm`
* Framework: React + TypeScript
* Herramienta de bundling: Vite
* Lógica actual acoplada a Supabase en: `frontend/src/hooks/useSources.tsx`
* Supabase client actual: `@/integrations/supabase/client.ts`
* Logger: `@/services/logger`
* Notificación UI: `@/hooks/use-toast`
* Variables de entorno: `VITE_SUPABASE_BUCKET_SOURCE`

---

### 🛠️ Estructura esperada

1. **Nuevo repositorio desacoplado** (por ejemplo `supabase-source.repository.ts`)
1. **Nuevo servicio desacoplado** (por ejemplo `source.service.ts`)
2. **Clase de fábrica para crear instancias de servicio de note con sus dependencias** (por ejemplo `source.factory.ts`)
3. **Refactor del hook `useSources.tsx`** para usar el nuevo servicio
---

## Contenido del archivo useSources.tsx

```tsx  

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotebookGeneration } from './useNotebookGeneration';
import { useEffect } from 'react';

export const useSources = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { generateNotebookContentAsync } = useNotebookGeneration();

  const {
    data: sources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sources', notebookId],
    queryFn: async () => {
      if (!notebookId) return [];
      
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!notebookId,
  });

  // Set up Realtime subscription for sources table
  useEffect(() => {
    if (!notebookId || !user) return;

    console.log('Setting up Realtime subscription for sources table, notebook:', notebookId);

    const channel = supabase
      .channel('sources-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'sources',
          filter: `notebook_id=eq.${notebookId}`
        },
        (payload: any) => {
          console.log('Realtime: Sources change received:', payload);
          
          // Update the query cache based on the event type
          queryClient.setQueryData(['sources', notebookId], (oldSources: any[] = []) => {
            switch (payload.eventType) {
              case 'INSERT':
                // Add new source if it doesn't already exist
                const newSource = payload.new as any;
                const existsInsert = oldSources.some(source => source.id === newSource?.id);
                if (existsInsert) {
                  console.log('Source already exists, skipping INSERT:', newSource?.id);
                  return oldSources;
                }
                console.log('Adding new source to cache:', newSource);
                return [newSource, ...oldSources];
                
              case 'UPDATE':
                // Update existing source
                const updatedSource = payload.new as any;
                console.log('Updating source in cache:', updatedSource?.id);
                return oldSources.map(source => 
                  source.id === updatedSource?.id ? updatedSource : source
                );
                
              case 'DELETE':
                // Remove deleted source
                const deletedSource = payload.old as any;
                console.log('Removing source from cache:', deletedSource?.id);
                return oldSources.filter(source => source.id !== deletedSource?.id);
                
              default:
                console.log('Unknown event type:', payload.eventType);
                return oldSources;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status for sources:', status);
      });

    return () => {
      console.log('Cleaning up Realtime subscription for sources');
      supabase.removeChannel(channel);
    };
  }, [notebookId, user, queryClient]);

  const addSource = useMutation({
    mutationFn: async (sourceData: {
      notebookId: string;
      title: string;
      type: 'pdf' | 'text' | 'website' | 'youtube' | 'audio';
      content?: string;
      url?: string;
      file_path?: string;
      file_size?: number;
      processing_status?: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sources')
        .insert({
          notebook_id: sourceData.notebookId,
          title: sourceData.title,
          type: sourceData.type,
          content: sourceData.content,
          url: sourceData.url,
          file_path: sourceData.file_path,
          file_size: sourceData.file_size,
          processing_status: sourceData.processing_status,
          metadata: sourceData.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (newSource) => {
      console.log('Source added successfully:', newSource);
      
      // The Realtime subscription will handle updating the cache
      // But we still check for first source to trigger generation
      const currentSources = queryClient.getQueryData(['sources', notebookId]) as any[] || [];
      const isFirstSource = currentSources.length === 0;
      
      if (isFirstSource && notebookId) {
        console.log('This is the first source, checking notebook generation status...');
        
        // Check notebook generation status
        const { data: notebook } = await supabase
          .from('notebooks')
          .select('generation_status')
          .eq('id', notebookId)
          .single();
        
        if (notebook?.generation_status === 'pending') {
          console.log('Triggering notebook content generation...');
          
          // Determine if we can trigger generation based on source type and available data
          const canGenerate = 
            (newSource.type === 'pdf' && newSource.file_path) ||
            (newSource.type === 'text' && newSource.content) ||
            (newSource.type === 'website' && newSource.url) ||
            (newSource.type === 'youtube' && newSource.url) ||
            (newSource.type === 'audio' && newSource.file_path);
          
          if (canGenerate) {
            try {
              await generateNotebookContentAsync({
                notebookId,
                filePath: newSource.file_path || newSource.url,
                sourceType: newSource.type
              });
            } catch (error) {
              console.error('Failed to generate notebook content:', error);
            }
          } else {
            console.log('Source not ready for generation yet - missing required data');
          }
        }
      }
    },
  });

  const updateSource = useMutation({
    mutationFn: async ({ sourceId, updates }: { 
      sourceId: string; 
      updates: { 
        title?: string;
        file_path?: string;
        processing_status?: string;
      }
    }) => {
      const { data, error } = await supabase
        .from('sources')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (updatedSource) => {
      // The Realtime subscription will handle updating the cache
      
      // If file_path was added and this is the first source, trigger generation
      if (updatedSource.file_path && notebookId) {
        const currentSources = queryClient.getQueryData(['sources', notebookId]) as any[] || [];
        const isFirstSource = currentSources.length === 1;
        
        if (isFirstSource) {
          const { data: notebook } = await supabase
            .from('notebooks')
            .select('generation_status')
            .eq('id', notebookId)
            .single();
          
          if (notebook?.generation_status === 'pending') {
            console.log('File path updated, triggering notebook content generation...');
            
            try {
              await generateNotebookContentAsync({
                notebookId,
                filePath: updatedSource.file_path,
                sourceType: updatedSource.type
              });
            } catch (error) {
              console.error('Failed to generate notebook content:', error);
            }
          }
        }
      }
    },
  });

  return {
    sources,
    isLoading,
    error,
    addSource: addSource.mutate,
    addSourceAsync: addSource.mutateAsync,
    isAdding: addSource.isPending,
    updateSource: updateSource.mutate,
    isUpdating: updateSource.isPending,
  };
};
```


### Ejemplo de useNotes.tsx
```tsx
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { NoteFactory } from '@/services/note.factory';
import { NoteService } from '@/services/note.service';
import { NoteData } from '@/repositories/interfaces/note.repository.interface';

/**
 * Hook personalizado para la gestión de notas
 * Utiliza el patrón de inyección de dependencias a través del factory
 */
export const useNotes = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Instancia del servicio de notas creada mediante factory 
  const noteService: NoteService = useMemo(() => {
      return NoteFactory.createNoteService();
    }, []);

  /**
   * Query para obtener las notas de un notebook
   */
  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', notebookId],
    queryFn: () => noteService.getNotesByNotebook(notebookId!),
    enabled: !!notebookId && !!user,
  });

  /**
   * Mutación para crear una nueva nota
   */
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
      return noteService.createNote({
        notebookId: notebookId!,
        title,
        content,
        source_type,
        extracted_text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  /**
   * Mutación para actualizar una nota existente
   */
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      return noteService.updateNote({ id, title, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  /**
   * Mutación para eliminar una nota
   */
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return noteService.deleteNote(id);
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

// Re-exportamos el tipo NoteData para mantener compatibilidad
export type { NoteData };

// Alias para compatibilidad hacia atrás
export type Note = NoteData;
```


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

