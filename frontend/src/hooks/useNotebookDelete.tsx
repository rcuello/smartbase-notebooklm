import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotebookFactory } from '@/services/notebook.factory';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { NotebookService } from '@/services/notebook.service';

/**
 * Hook for deleting notebooks with proper error handling and cache invalidation
 * Uses dependency injection pattern to avoid vendor lock-in
 */
export const useNotebookDelete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get notebook service instance through factory
  //const notebookService = NotebookFactory.createNotebookService();
  const notebookService: NotebookService = useMemo(() => {
        return NotebookFactory.createNotebookService();
      }, []);

  const deleteNotebook = useMutation({
    mutationFn: async (notebookId: string) => {
      if (!user?.id) {
        throw new Error('User authentication required');
      }

      if (!notebookId?.trim()) {
        throw new Error('Notebook ID is required');
      }

      logger.info('Initiating notebook deletion:', { notebookId, userId: user.id });
      
      // Use service layer instead of direct Supabase calls
      await notebookService.deleteNotebook(notebookId, user.id);
      
      logger.info('Notebook deleted successfully:', { notebookId });
    },
    onSuccess: (_, notebookId) => {
      // Invalidate and refetch notebooks list
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      
      // Remove specific notebook from cache
      queryClient.removeQueries({ queryKey: ['notebook', notebookId] });
      
      // Show success notification
      toast({
        title: 'Notebook deleted',
        description: 'The notebook has been successfully deleted.',
      });
      
      logger.info('Notebook deletion completed and cache updated:', { notebookId });
    },
    onError: (error, notebookId) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notebook';
      
      logger.error('Notebook deletion failed:', { 
        notebookId, 
        error: errorMessage,
        userId: user?.id 
      });
      
      // Show error notification
      toast({
        title: 'Error deleting notebook',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    deleteNotebook: deleteNotebook.mutate,
    deleteNotebookAsync: deleteNotebook.mutateAsync,
    isDeleting: deleteNotebook.isPending,
    error: deleteNotebook.error,
  };
};