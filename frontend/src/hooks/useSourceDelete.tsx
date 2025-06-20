import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SourceFactory } from '@/services/source.factory';
import { SourceService } from '@/services/source.service';
import { logger } from '@/services/logger';

/**
 * Hook personalizado para eliminar fuentes
 * Utiliza el patrón de inyección de dependencias a través del factory
 */
export const useSourceDelete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Instancia del servicio de fuentes creada mediante factory
  const sourceService: SourceService = useMemo(() => {
    return SourceFactory.createSourceService();
  }, []);

  /**
   * Mutación para eliminar una fuente
   */
  const deleteSource = useMutation({
    mutationFn: async (sourceId: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      logger.info('Starting source deletion process for:', sourceId);
      
      try {
        const deletedSource = await sourceService.deleteSource(sourceId);
        logger.info('Source deletion completed successfully');
        return deletedSource;
      } catch (error) {
        logger.error('Error in source deletion process:', error);
        throw error;
      }
    },
    onSuccess: (deletedSource) => {
      logger.info('Delete mutation success, invalidating queries');
      
      // Invalida las queries relacionadas con fuentes
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      
      // Muestra notificación de éxito
      toast({
        title: "Source deleted",
        description: `"${deletedSource?.title || 'Source'}" has been successfully deleted.`,
      });
    },
    onError: (error: any) => {
      logger.error('Delete mutation error:', error);
      
      // Determina el mensaje de error apropiado
      const errorMessage = getErrorMessage(error);
      
      // Muestra notificación de error
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    deleteSource: deleteSource.mutate,
    isDeleting: deleteSource.isPending,
  };
};

/**
 * Determina el mensaje de error apropiado basado en el tipo de error
 */
function getErrorMessage(error: any): string {
  // Error de permisos o fuente no encontrada
  if (error?.code === 'PGRST116') {
    return "Source not found or you don't have permission to delete it.";
  }
  
  // Error de dependencias de clave foránea
  if (error?.message?.includes('foreign key')) {
    return "Cannot delete source due to data dependencies. Please contact support.";
  }
  
  // Error de red
  if (error?.message?.includes('network')) {
    return "Network error. Please check your connection and try again.";
  }
  
  // Error de autenticación
  if (error?.message?.includes('not authenticated')) {
    return "You must be logged in to delete sources.";
  }
  
  // Error genérico
  return "Failed to delete the source. Please try again.";
}