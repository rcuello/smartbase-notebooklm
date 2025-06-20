// src/hooks/useSourceUpdate.tsx

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SourceFactory } from '@/services/source.factory';
import { SourceService } from '@/services/source.service';
import { logger } from '@/services/logger';

/**
 * Hook personalizado para actualizar fuentes
 * Utiliza el patrón de inyección de dependencias a través del factory
 */
export const useSourceUpdate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Instancia del servicio de fuentes creada mediante factory
  const sourceService: SourceService = useMemo(() => {
    return SourceFactory.createSourceService();
  }, []);

  /**
   * Mutación para actualizar una fuente existente
   */
  const updateSource = useMutation({
    mutationFn: async ({ sourceId, title }: { sourceId: string; title: string }) => {
      // Validación básica de autenticación
      if (!user) {
        throw new Error('User not authenticated');
      }

      logger.info('Updating source:', sourceId, 'with title:', title);
      
      // Usar el servicio desacoplado para la actualización
      return await sourceService.updateSource(sourceId, { title });
    },
    onSuccess: (updatedSource) => {
      logger.info('Update mutation success, invalidating queries');
      
      // Invalidar queries relacionadas para refrescar la UI
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      
      // Mostrar notificación de éxito
      toast({
        title: "Source renamed",
        description: "The source has been successfully renamed.",
      });

      logger.info('Source updated successfully:', updatedSource.id);
    },
    onError: (error) => {
      logger.error('Update mutation error:', error);
      
      // Mostrar notificación de error
      toast({
        title: "Error",
        description: "Failed to rename the source. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    updateSource: updateSource.mutate,
    updateSourceAsync: updateSource.mutateAsync,
    isUpdating: updateSource.isPending,
  };
};