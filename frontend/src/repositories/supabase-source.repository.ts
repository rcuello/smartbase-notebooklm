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
