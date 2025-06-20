Actúa como un desarrollador senior experto en **React**, **TypeScript** y **arquitectura limpia**, con dominio en principios **KISS** y buenas prácticas.
Estás trabajando en una aplicación moderna llamada `smartbase-notebooklm`, que replica las funciones de Google NotebookLM usando **React + Vite + TypeScript**.

---

### 🎯 Objetivo

Desacopla completamente el uso de **Supabase** en la lógica de subida de archivos implementada en `useNotebookDelete.tsx`, reemplazando la lógica directa por un **servicio o repositorio inyectable y reutilizable**.
Esto permitirá sustituir fácilmente Supabase por otros mecanismos de almacenamiento en el futuro y **evitar vendor lock-in**.

---

### 📍 Instrucciones

* **No expliques nada. Solo devuelve el código necesario.**
* Refactoriza el código en `useNotebookDelete.tsx` para **eliminar la dependencia directa de Supabase**.
* Crea o modifica repositorios ,servicios  reutilizables que encapsule la lógica actual crear,editar,eliminar (donde aplique).
* Aplica buenas prácticas, separación de responsabilidades y principios KISS.
* **Es válido agregar comentarios en el código donde sea necesario** para mejorar su comprensión y mantenibilidad.
* Usa nombres consistentes con el estilo del proyecto (`camelCase`, `PascalCase` donde corresponda).

---

### 🧠 Contexto clave

* Proyecto: `smartbase-notebooklm`
* Framework: React + TypeScript
* Herramienta de bundling: Vite
* Lógica actual acoplada a Supabase en: `frontend/src/hooks/useNotebookDelete.tsx`
* Supabase client actual: `@/integrations/supabase/client.ts`
* Logger: `@/services/logger`
* Notificación UI: `@/hooks/use-toast`
* Variables de entorno: `VITE_SUPABASE_BUCKET_SOURCE`

---

### 🛠️ Estructura esperada

1. **Refactor del hook `useNotebookDelete.tsx`** para usar el nuevo servicio
---

## Contenido del archivo useNotebookDelete.tsx

```tsx  

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNotebookUpdate = () => {
  const queryClient = useQueryClient();

  const updateNotebook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { title?: string; description?: string } }) => {
      console.log('Updating notebook wtf:', id, updates);
      
      const { data, error } = await supabase
        .from('notebooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notebook:', error);
        throw error;
      }
      
      console.log('Notebook updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['notebook', data.id] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  return {
    updateNotebook: updateNotebook.mutate,
    isUpdating: updateNotebook.isPending,
  };
};

```
### Contenido del archivo notebook.service.ts
```tsx
import { 
  INotebookRepository, 
  NotebookUpdateData, 
  NotebookData, 
  NotebookCreateData,
  NotebookFilters,
  NotebookQueryOptions
} from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';

export interface NotebookServiceError extends Error {
  code?: string;
  details?: unknown;
}

export class NotebookService {
  constructor(private notebookRepository: INotebookRepository) {}

  /**
   * Fetches notebooks for a user with optional filtering and pagination
   * @param userId - User ID to fetch notebooks for
   * @param options - Query options and filters
   * @returns Promise with notebooks array
   */
  async getUserNotebooks(
    userId: string, 
    options?: {
      status?: 'pending' | 'processing' | 'completed' | 'error';
      includeSources?: boolean;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'title';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<NotebookData[]> {
    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    const filters: NotebookFilters = {
      userId,
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    };

    const queryOptions: NotebookQueryOptions = {
      includeSources: options?.includeSources ?? true,
      orderBy: options?.orderBy || 'updated_at',
      orderDirection: options?.orderDirection || 'desc',
    };

    logger.info('Fetching user notebooks:', { userId, filters, queryOptions });
    
    try {
      return await this.notebookRepository.findMany(filters, queryOptions);
    } catch (error) {
      logger.error('Failed to fetch user notebooks:', { userId, error });
      throw this.createError('Failed to fetch notebooks', 'FETCH_FAILED', error);
    }
  }

  /**
   * Fetches a single notebook by ID with user validation
   * @param id - Notebook ID
   * @param userId - User ID for authorization
   * @param includeSources - Whether to include source counts
   * @returns Promise with notebook data or null if not found/unauthorized
   */
  async getNotebook(id: string, userId: string, includeSources = true): Promise<NotebookData | null> {
    if (!id?.trim()) {
      throw this.createError('Notebook ID is required', 'INVALID_NOTEBOOK_ID');
    }

    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    logger.info('Fetching notebook:', { id, userId, includeSources });
    
    try {
      const notebook = await this.notebookRepository.findById(id, { includeSources });
      
      // Check authorization
      if (notebook && notebook.user_id !== userId) {
        logger.warn('Unauthorized notebook access attempt:', { id, userId, ownerId: notebook.user_id });
        return null; // Don't expose existence of notebook to unauthorized users
      }

      return notebook;
    } catch (error) {
      logger.error('Failed to fetch notebook:', { id, userId, error });
      throw this.createError('Failed to fetch notebook', 'FETCH_FAILED', error);
    }
  }

  /**
   * Updates a notebook with validation and authorization
   * @param id - Notebook ID to update
   * @param userId - User ID for authorization
   * @param updates - Data to update
   * @returns Promise with updated notebook data
   */
  /*async updateNotebook(id: string, userId: string, updates: NotebookUpdateData): Promise<NotebookData> {
    if (!id?.trim()) {
      throw this.createError('Notebook ID is required', 'INVALID_NOTEBOOK_ID');
    }

    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw this.createError('At least one field to update is required', 'NO_UPDATES');
    }

    // Verify ownership before updating
    const existingNotebook = await this.getNotebook(id, userId, false);
    if (!existingNotebook) {
      throw this.createError('Notebook not found or access denied', 'NOT_FOUND');
    }

    // Clean and validate updates
    const cleanUpdates = this.sanitizeUpdateData(updates);

    logger.info('Updating notebook:', { id, userId, updates: cleanUpdates });
    
    try {
      return await this.notebookRepository.update(id, cleanUpdates);
    } catch (error) {
      logger.error('Failed to update notebook:', { id, userId, error });
      throw this.createError('Failed to update notebook', 'UPDATE_FAILED', error);
    }
  }*/

  /**
   * Updates a notebook with validation and business logic
  * @param id - Notebook ID to update
   * @param updates - Data to update
   * @returns Promise with updated notebook data
   */
  async updateNotebook(id: string, updates: NotebookUpdateData): Promise<NotebookData> {
    // Validate input
    if (!id?.trim()) {
      throw new Error('Notebook ID is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one field to update is required');
    }

    // Trim string values if present
    const cleanUpdates: NotebookUpdateData = {};
    if (updates.title !== undefined) {
      cleanUpdates.title = updates.title.trim();
    }
    if (updates.description !== undefined) {
      cleanUpdates.description = updates.description.trim();
    }

    logger.info('Processing notebook update:', { id, updates: cleanUpdates });
    
    try {
      return await this.notebookRepository.update(id, cleanUpdates);
    } catch (error) {
      logger.error('Failed to update notebook:', { id, error });
      throw error;
    }
  }

  /**
   * Creates a new notebook with validation
   * @param data - Notebook data to create
   * @returns Promise with created notebook data
   */
  async createNotebook(data: NotebookCreateData): Promise<NotebookData> {
    // Validate required fields
    if (!data.title?.trim()) {
      throw this.createError('Notebook title is required', 'INVALID_TITLE');
    }

    if (!data.user_id?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    const cleanData: NotebookCreateData = {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      user_id: data.user_id,
      generation_status: data.generation_status || 'pending',
    };

    logger.info('Creating notebook:', { title: cleanData.title, userId: cleanData.user_id });
    
    try {
      return await this.notebookRepository.create(cleanData);
    } catch (error) {
      logger.error('Failed to create notebook:', { data: cleanData, error });
      throw this.createError('Failed to create notebook', 'CREATE_FAILED', error);
    }
  }

  /**
   * Deletes a notebook with authorization check
   * @param id - Notebook ID to delete
   * @param userId - User ID for authorization
   * @returns Promise with void
   */
  async deleteNotebook(id: string, userId: string): Promise<void> {
    if (!id?.trim()) {
      throw this.createError('Notebook ID is required', 'INVALID_NOTEBOOK_ID');
    }

    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    // Verify ownership before deleting
    const existingNotebook = await this.getNotebook(id, userId, false);
    if (!existingNotebook) {
      throw this.createError('Notebook not found or access denied', 'NOT_FOUND');
    }

    logger.info('Deleting notebook:', { id, userId });
    
    try {
      await this.notebookRepository.delete(id);
    } catch (error) {
      logger.error('Failed to delete notebook:', { id, userId, error });
      throw this.createError('Failed to delete notebook', 'DELETE_FAILED', error);
    }
  }

  /**
   * Gets notebook count for a user
   * @param userId - User ID
   * @param status - Optional status filter
   * @returns Promise with count number
   */
  async getUserNotebookCount(
    userId: string, 
    status?: 'pending' | 'processing' | 'completed' | 'error'
  ): Promise<number> {
    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    const filters: NotebookFilters = { userId, status };

    logger.info('Counting user notebooks:', { userId, status });
    
    try {
      return await this.notebookRepository.count(filters);
    } catch (error) {
      logger.error('Failed to count notebooks:', { userId, status, error });
      throw this.createError('Failed to count notebooks', 'COUNT_FAILED', error);
    }
  }

  /**
   * Private method to sanitize update data
   * @param updates - Raw update data
   * @returns Cleaned update data
   */
  private sanitizeUpdateData(updates: NotebookUpdateData): NotebookUpdateData {
    const cleanUpdates: NotebookUpdateData = {};
    
    if (updates.title !== undefined) {
      const trimmedTitle = updates.title.trim();
      if (!trimmedTitle) {
        throw this.createError('Title cannot be empty', 'INVALID_TITLE');
      }
      cleanUpdates.title = trimmedTitle;
    }
    
    if (updates.description !== undefined) {
      cleanUpdates.description = updates.description.trim();
    }

    if (updates.generation_status !== undefined) {
      const validStatuses = ['pending', 'processing', 'completed', 'error'];
      if (!validStatuses.includes(updates.generation_status)) {
        throw this.createError('Invalid generation status', 'INVALID_STATUS');
      }
      cleanUpdates.generation_status = updates.generation_status;
    }

    return cleanUpdates;
  }

  /**
   * Private method to create standardized errors
   * @param message - Error message
   * @param code - Error code
   * @param originalError - Original error if any
   * @returns NotebookServiceError
   */
  private createError(message: string, code: string, originalError?: unknown): NotebookServiceError {
    const error = new Error(message) as NotebookServiceError;
    error.code = code;
    error.details = originalError;
    return error;
  }
}
```

### Contenido del archivo supabase-notebook.repository.ts

```tsx
import { supabase } from '@/integrations/supabase/client';
import {
  INotebookRepository,
  NotebookUpdateData,
  NotebookData,
  NotebookCreateData,
  NotebookFilters,
  NotebookQueryOptions,
} from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';

export class SupabaseNotebookRepository implements INotebookRepository {
  async findMany(
    filters?: NotebookFilters,
    options?: NotebookQueryOptions
  ): Promise<NotebookData[]> {
    logger.info('Fetching notebooks with filters:', { filters, options });

    try {
      // Build base query
      let query = supabase.from('notebooks').select('*');

      // Apply filters
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = query.eq('generation_status', filters.status);
      }

      // Apply ordering
      const orderBy = options?.orderBy || 'updated_at';
      const orderDirection = options?.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: notebooks, error } = await query;

      if (error) {
        logger.error('Error fetching notebooks:', error);
        throw error;
      }

      // Fetch source counts if requested
      if (options?.includeSources && notebooks?.length) {
        const castedNotebooks: NotebookData[] = (notebooks || []).map(notebook => ({
          ...notebook,
          generation_status: notebook.generation_status as NotebookData['generation_status'],
        }));

        const notebooksWithCounts = await this.enrichWithSourceCounts(castedNotebooks);
        logger.info('Fetched notebooks with source counts:', notebooksWithCounts.length);
        return notebooksWithCounts;
      }

      logger.info('Fetched notebooks:', notebooks?.length || 0);
      return (notebooks || []).map(notebook => ({
        ...notebook,
        generation_status: notebook.generation_status as NotebookData['generation_status'],
      }));
    } catch (error) {
      logger.error('Failed to fetch notebooks:', error);
      throw error;
    }
  }

  async findById(id: string, options?: NotebookQueryOptions): Promise<NotebookData | null> {
    logger.info('Fetching notebook by ID:', { id, options });

    try {
      const { data: notebook, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          logger.info('Notebook not found:', id);
          return null;
        }
        logger.error('Error fetching notebook:', error);
        throw error;
      }

      // Enrich with source count if requested
      if (options?.includeSources && notebook) {
        const castedNotebook: NotebookData = {
          ...notebook,
          generation_status: notebook.generation_status as NotebookData['generation_status'],
        };

        const [enrichedNotebook] = await this.enrichWithSourceCounts([castedNotebook]);

        logger.info('Fetched notebook with source count:', enrichedNotebook.id);
        return {
          ...enrichedNotebook,
          generation_status:
            enrichedNotebook.generation_status as NotebookData['generation_status'],
        };
      }

      logger.info('Fetched notebook:', notebook.id);
      return {
        ...notebook,
        generation_status: notebook.generation_status as NotebookData['generation_status'],
      };
    } catch (error) {
      logger.error('Failed to fetch notebook by ID:', { id, error });
      throw error;
    }
  }

  async update(id: string, updates: NotebookUpdateData): Promise<NotebookData> {
    logger.info('Updating notebook:', { id, updates });

    try {
      const { data, error } = await supabase
        .from('notebooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating notebook:', error);
        throw error;
      }

      logger.info('Notebook updated successfully wtf:', data.id);
      // Ensure generation_status is cast to the correct union type
      return {
        ...data,
        generation_status: data.generation_status as NotebookData['generation_status'],
      };
    } catch (error) {
      logger.error('Failed to update notebook:', { id, error });
      throw error;
    }
  }

  async create(data: NotebookCreateData): Promise<NotebookData> {
    logger.info('Creating notebook:', { title: data.title, userId: data.user_id });

    try {
      const { data: createdData, error } = await supabase
        .from('notebooks')
        .insert({
          ...data,
          generation_status: data.generation_status || 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating notebook:', error);
        throw error;
      }

      logger.info('Notebook created successfully:', createdData.id);
      // Ensure generation_status is cast to the correct union type
      return {
        ...createdData,
        generation_status: createdData.generation_status as NotebookData['generation_status'],
      };
    } catch (error) {
      logger.error('Failed to create notebook:', { data, error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    logger.info('Deleting notebook:', { id });

    try {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting notebook:', error);
        throw error;
      }

      logger.info('Notebook deleted successfully:', { id });
    } catch (error) {
      logger.error('Failed to delete notebook:', { id, error });
      throw error;
    }
  }

  async count(filters?: NotebookFilters): Promise<number> {
    logger.info('Counting notebooks with filters:', filters);

    try {
      let query = supabase.from('notebooks').select('*', { count: 'exact', head: true });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = query.eq('generation_status', filters.status);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('Error counting notebooks:', error);
        throw error;
      }

      logger.info('Notebook count:', count || 0);
      return count || 0;
    } catch (error) {
      logger.error('Failed to count notebooks:', { filters, error });
      throw error;
    }
  }

  /**
   * Private method to enrich notebooks with source counts
   * @param notebooks - Array of notebooks to enrich
   * @returns Promise with notebooks including source counts
   */
  private async enrichWithSourceCounts(notebooks: NotebookData[]): Promise<NotebookData[]> {
    try {
      const notebooksWithCounts = await Promise.all(
        notebooks.map(async notebook => {
          const { count, error: countError } = await supabase
            .from('sources')
            .select('*', { count: 'exact', head: true })
            .eq('notebook_id', notebook.id);

          if (countError) {
            logger.error('Error fetching source count for notebook:', {
              notebookId: notebook.id,
              error: countError,
            });
            return { ...notebook, sources: [{ count: 0 }] };
          }

          return { ...notebook, sources: [{ count: count || 0 }] };
        })
      );

      return notebooksWithCounts;
    } catch (error) {
      logger.error('Failed to enrich notebooks with source counts:', error);
      throw error;
    }
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

