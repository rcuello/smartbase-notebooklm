Actúa como un desarrollador senior experto en **React**, **TypeScript** y **arquitectura limpia**, con dominio en principios **KISS** y buenas prácticas.
Estás trabajando en una aplicación moderna llamada `smartbase-notebooklm`, que replica las funciones de Google NotebookLM usando **React + Vite + TypeScript**.

---

### 🎯 Objetivo

Desacopla completamente el uso de **Supabase** en la lógica de subida de archivos implementada en `useSourceUpdate.tsx`, reemplazando la lógica directa por un **servicio o repositorio inyectable y reutilizable**.
Esto permitirá sustituir fácilmente Supabase por otros mecanismos de almacenamiento en el futuro y **evitar vendor lock-in**.

---

### 📍 Instrucciones

* **No expliques nada. Solo devuelve el código necesario.**
* Refactoriza el código en `useSourceUpdate.tsx` para **eliminar la dependencia directa de Supabase**.
* Crea o modifica repositorios ,servicios  reutilizables que encapsule la lógica actual crear,editar,eliminar (donde aplique).
* Aplica buenas prácticas, separación de responsabilidades y principios KISS.
* **Es válido agregar comentarios en el código donde sea necesario** para mejorar su comprensión y mantenibilidad.
* Usa nombres consistentes con el estilo del proyecto (`camelCase`, `PascalCase` donde corresponda).

---

### 🧠 Contexto clave

* Proyecto: `smartbase-notebooklm`
* Framework: React + TypeScript
* Herramienta de bundling: Vite
* Lógica actual acoplada a Supabase en: `frontend/src/hooks/useSourceUpdate.tsx`
* Supabase client actual: `@/integrations/supabase/client.ts`
* Logger: `@/services/logger`
* Notificación UI: `@/hooks/use-toast`
* Variables de entorno: `VITE_SUPABASE_BUCKET_SOURCE`

---

### 🛠️ Estructura esperada

1. **Refactor del hook `useSourceUpdate.tsx`** para usar el nuevo servicio
---

## Contenido del archivo useSourceUpdate.tsx

```tsx  

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSourceUpdate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const updateSource = useMutation({
    mutationFn: async ({ sourceId, title }: { sourceId: string; title: string }) => {
      console.log('Updating source:', sourceId, 'with title:', title);
      
      const { data, error } = await supabase
        .from('sources')
        .update({ title })
        .eq('id', sourceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating source:', error);
        throw error;
      }
      
      console.log('Source updated successfully');
      return data;
    },
    onSuccess: () => {
      console.log('Update mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast({
        title: "Source renamed",
        description: "The source has been successfully renamed.",
      });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to rename the source. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    updateSource: updateSource.mutate,
    isUpdating: updateSource.isPending,
  };
};

```


### Ejemplo de useSources.tsx
```tsx
import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotebookGeneration } from './useNotebookGeneration';
import { SourceFactory } from '@/services/source.factory';
import { SourceService } from '@/services/source.service';
import { SourceData, CreateSourceData } from '@/repositories/interfaces/source.repository.interface';
import { logger } from '@/services/logger';

/**
 * Hook personalizado para la gestión de fuentes
 * Utiliza el patrón de inyección de dependencias a través del factory
 */
export const useSources = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { generateNotebookContentAsync } = useNotebookGeneration();

  // Instancia del servicio de fuentes creada mediante factory
  const sourceService: SourceService = useMemo(() => {
    return SourceFactory.createSourceService();
  }, []);

  /**
   * Query para obtener las fuentes de un notebook
   */
  const {
    data: sources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sources', notebookId],
    queryFn: () => sourceService.getSourcesByNotebook(notebookId!),
    enabled: !!notebookId,
  });

  /**
   * Configuración de suscripción en tiempo real para cambios en fuentes
   */
  useEffect(() => {
    if (!notebookId || !user) return;

    const unsubscribe = sourceService.subscribeToSourceChanges(
      notebookId,
      (eventType: string, sourceData: SourceData) => {
        // Actualiza la cache de react-query basado en el tipo de evento
        queryClient.setQueryData(['sources', notebookId], (oldSources: SourceData[] = []) => {
          switch (eventType) {
            case 'INSERT':
              // Agrega nueva fuente si no existe ya
              const existsInsert = oldSources.some(source => source.id === sourceData?.id);
              if (existsInsert) {
                logger.info('Source already exists, skipping INSERT:', sourceData?.id);
                return oldSources;
              }
              logger.info('Adding new source to cache:', sourceData);
              return [sourceData, ...oldSources];
              
            case 'UPDATE':
              // Actualiza fuente existente
              logger.info('Updating source in cache:', sourceData?.id);
              return oldSources.map(source => 
                source.id === sourceData?.id ? sourceData : source
              );
              
            case 'DELETE':
              // Elimina fuente borrada
              logger.info('Removing source from cache:', sourceData?.id);
              return oldSources.filter(source => source.id !== sourceData?.id);
              
            default:
              logger.warn('Unknown event type:', eventType);
              return oldSources;
          }
        });
      }
    );

    return unsubscribe;
  }, [notebookId, user, queryClient, sourceService]);

  /**
   * Mutación para crear una nueva fuente
   */
  const addSource = useMutation({
    mutationFn: async (sourceData: CreateSourceData) => {
      if (!user) throw new Error('User not authenticated');
      
      return sourceService.createSource(sourceData);
    },
    onSuccess: async (newSource: SourceData) => {
      logger.info('Source added successfully:', newSource);
      
      // Verifica si es la primera fuente para disparar generación
      const currentSources = queryClient.getQueryData(['sources', notebookId]) as SourceData[] || [];
      const isFirstSource = currentSources.length === 0;
      
      if (isFirstSource && notebookId) {
        await handleFirstSourceGeneration(newSource, notebookId);
      }
    },
  });

  /**
   * Mutación para actualizar una fuente existente
   */
  const updateSource = useMutation({
    mutationFn: async ({ 
      sourceId, 
      updates 
    }: { 
      sourceId: string; 
      updates: { 
        title?: string;
        file_path?: string;
        processing_status?: string;
      }
    }) => {
      return sourceService.updateSource(sourceId, updates);
    },
    onSuccess: async (updatedSource: SourceData) => {
      logger.info('Source updated successfully:', updatedSource.id);
      
      // Si se agregó file_path y es la primera fuente, disparar generación
      if (updatedSource.file_path && notebookId) {
        const currentSources = queryClient.getQueryData(['sources', notebookId]) as SourceData[] || [];
        const isFirstSource = currentSources.length === 1;
        
        if (isFirstSource) {
          await handleFirstSourceGeneration(updatedSource, notebookId);
        }
      }
    },
  });

  /**
   * Maneja la generación de contenido para la primera fuente
   */
  const handleFirstSourceGeneration = async (source: SourceData, notebookId: string) => {
    try {
      logger.info('Checking notebook generation status for first source...');
      
      // Verifica el estado de generación del notebook
      const { data: notebook } = await supabase
        .from('notebooks')
        .select('generation_status')
        .eq('id', notebookId)
        .single();
      
      if (notebook?.generation_status === 'pending') {
        logger.info('Triggering notebook content generation...');
        
        // Verifica si la fuente puede disparar generación
        const canGenerate = sourceService.canSourceTriggerGeneration(source);
        
        if (canGenerate) {
          await generateNotebookContentAsync({
            notebookId,
            filePath: source.file_path || source.url,
            sourceType: source.type
          });
        } else {
          logger.info('Source not ready for generation yet - missing required data');
        }
      }
    } catch (error) {
      logger.error('Failed to generate notebook content:', error);
    }
  };

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

// Re-exportamos los tipos para mantener compatibilidad
export type { SourceData, CreateSourceData };

// Alias para compatibilidad hacia atrás
export type Source = SourceData;
```
## Repositorio SupabaseSourceRepository
```ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';
import {
  SourceRepositoryInterface,
  SourceData,
  CreateSourceData,
  UpdateSourceData,
} from '@/repositories/interfaces/source.repository.interface';
import { SourceChangeHandler, SourceRealtimeSubscriptionManager } from '@/services/realtime/source.realtime.manager';

/**
 * Implementación del repositorio de fuentes usando Supabase
 * Encapsula toda la lógica específica de Supabase para operaciones con fuentes
 */
export class SupabaseSourceRepository implements SourceRepositoryInterface {
  private realtimeManager: SourceRealtimeSubscriptionManager;
  constructor() {
    this.realtimeManager = new SourceRealtimeSubscriptionManager();
  }

  /**
   * Obtiene una fuente específica por su ID
   */
  async getSourceById(sourceId: string): Promise<SourceData> {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (error) {
        logger.error('Error fetching source by ID:', error);
        throw new Error(`Failed to fetch source: ${error.message}`);
      }

      if (!data) {
        throw new Error('Source not found');
      }

      return data;
    } catch (error) {
      logger.error('Repository error in getSourceById:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las fuentes de un notebook ordenadas por fecha de creación
   */
  async getSourcesByNotebook(notebookId: string): Promise<SourceData[]> {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching sources:', error);
        throw new Error(`Failed to fetch sources: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Repository error in getSourcesByNotebook:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva fuente en la base de datos
   */
  async createSource(sourceData: CreateSourceData): Promise<SourceData> {
    try {
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

      if (error) {
        logger.error('Error creating source:', error);
        throw new Error(`Failed to create source: ${error.message}`);
      }

      logger.info('Source created successfully:', data.id);
      return data;
    } catch (error) {
      logger.error('Repository error in createSource:', error);
      throw error;
    }
  }

  /**
   * Actualiza una fuente existente
   */
  async updateSource(sourceId: string, updates: UpdateSourceData): Promise<SourceData> {
    try {
      const { data, error } = await supabase
        .from('sources')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating source:', error);
        throw new Error(`Failed to update source: ${error.message}`);
      }

      logger.info('Source updated successfully:', sourceId);
      return data;
    } catch (error) {
      logger.error('Repository error in updateSource:', error);
      throw error;
    }
  }

  /**
   * Elimina una fuente de la base de datos
   */
  async deleteSource(sourceId: string): Promise<void> {
    try {
      const { error } = await supabase.from('sources').delete().eq('id', sourceId);

      if (error) {
        logger.error('Error deleting source:', error);
        throw new Error(`Failed to delete source: ${error.message}`);
      }

      logger.info('Source deleted successfully from database:', sourceId);
    } catch (error) {
      logger.error('Repository error in deleteSource:', error);
      throw error;
    }
  }

  /**
   * Configura suscripción en tiempo real para cambios en fuentes de un notebook específico
   */
  subscribeToSourceChanges(
    notebookId: string,
    onSourceChange: (event: string, source: SourceData) => void
  ): () => void {
    logger.info('Setting up Realtime subscription for sources table, notebook:', notebookId);

    const channel = supabase
      .channel('sources-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'sources',
          filter: `notebook_id=eq.${notebookId}`,
        },
        (payload: any) => {
          logger.info('Realtime: Sources change received:', payload);

          const eventType = payload.eventType;
          const sourceData = payload.new || payload.old;

          if (sourceData) {
            onSourceChange(eventType, sourceData);
          }
        }
      )
      .subscribe(status => {
        logger.info('Realtime subscription status for sources:', status);
      });

    // Retorna función de limpieza
    return () => {
      logger.info('Cleaning up Realtime subscription for sources');
      supabase.removeChannel(channel);
    };
  }

  /**
   * Configura suscripción en tiempo real para cambios en fuentes de un notebook específico
   */
  subscribeToSourceChanges2(
    notebookId: string,
    onSourceChange: SourceChangeHandler
  ): () => void {
    return this.realtimeManager.subscribeToNotebookSources(notebookId, onSourceChange);
  }
}

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

