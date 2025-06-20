import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotebookGeneration } from './useNotebookGeneration';
import { SourceFactory } from '@/services/source.factory';
import { NotebookFactory } from '@/services/notebook.factory';
import { SourceService } from '@/services/source.service';
import { SourceData, CreateSourceData } from '@/repositories/interfaces/source.repository.interface';
import { logger } from '@/services/logger';
import { NotebookService } from '@/services/notebook.service';
import { NoteBookGenerationStatus } from '@/repositories/interfaces/notebook.repository.interface';

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

  // Instancia del servicio de notebooks creada mediante factory
  const notebookService: NotebookService = useMemo(() => {
    return NotebookFactory.createNotebookService();
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
      /*const { data: notebook } = await supabase
        .from('notebooks')
        .select('generation_status')
        .eq('id', notebookId)
        .single();
        */
      const notebookStatus = await notebookService.getNoteBooksGenerationStatus(notebookId);
      
      if (notebookStatus && notebookStatus === NoteBookGenerationStatus.Pending) {
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