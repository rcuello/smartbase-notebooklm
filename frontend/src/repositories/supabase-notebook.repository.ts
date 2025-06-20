import { supabase } from '@/integrations/supabase/client';
import {
  INotebookRepository,
  NotebookUpdateData,
  NotebookData,
  NotebookCreateData,
  NotebookFilters,
  NotebookQueryOptions,
  NoteBookGenerationStatus,
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
          audio_overview_generation_status:
            notebook.audio_overview_generation_status as NotebookData['audio_overview_generation_status'],
        }));

        const notebooksWithCounts = await this.enrichWithSourceCounts(castedNotebooks);
        logger.info('Fetched notebooks with source counts:', notebooksWithCounts.length);
        return notebooksWithCounts;
      }

      logger.info('Fetched notebooks:', notebooks?.length || 0);
      return (notebooks || []).map(notebook => ({
        ...notebook,
        generation_status: notebook.generation_status as NotebookData['generation_status'],
        audio_overview_generation_status:
          notebook.audio_overview_generation_status as NotebookData['audio_overview_generation_status'],
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
          audio_overview_generation_status:
            notebook.audio_overview_generation_status as NotebookData['audio_overview_generation_status'],
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
        audio_overview_generation_status:
          notebook.audio_overview_generation_status as NotebookData['audio_overview_generation_status'],
      };
    } catch (error) {
      logger.error('Failed to fetch notebook by ID:', { id, error });
      throw error;
    }
  }

  async findGenerationStatusById (id: string): Promise<NoteBookGenerationStatus | null> {
    logger.info('Fetching generation_status for notebook:', id);
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('generation_status')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.info('Notebook not found for generation_status:', id);
          return null;
        }

        logger.error('Error fetching generation_status:', { id, error });
        throw error;
      }

      return data.generation_status as NoteBookGenerationStatus;
      
    } catch (error) {
      logger.error('Failed to fetch generation_status:', { id, error });
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
        audio_overview_generation_status:
          (data.audio_overview_generation_status as NotebookData['audio_overview_generation_status']) ??
          null,
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
        audio_overview_generation_status:
          createdData.audio_overview_generation_status as NotebookData['audio_overview_generation_status'],
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
