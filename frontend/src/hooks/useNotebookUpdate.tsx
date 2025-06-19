import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotebookFactory } from '@/services/notebook.factory';
import { NotebookUpdateData } from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/use-toast';
import { NotebookService } from '@/services/notebook.service';

export const useNotebookUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Create service instance using factory pattern
  //const notebookService = NotebookFactory.createNotebookService();
  const notebookService: NotebookService = useMemo(() => {
      return NotebookFactory.createNotebookService();
    }, []);

  const updateNotebook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: NotebookUpdateData }) => {
      logger.info('Hook: Initiating notebook update:', { id, updates });
      
      try {
        const updatedNotebook = await notebookService.updateNotebook(id, updates);
        logger.info('Hook: Notebook update completed successfully:', updatedNotebook);
        return updatedNotebook;
      } catch (error) {
        logger.error('Hook: Notebook update failed:', { id, updates, error });
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.info('Hook: Mutation success, invalidating queries for notebook:', data.id);
      
      // Invalidate specific notebook query
      queryClient.invalidateQueries({ queryKey: ['notebook', data.id] });
      
      // Invalidate notebooks list query
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      
      // Show success notification
      toast({
        title: "Notebook updated",
        description: "Your notebook has been updated successfully.",
      });
    },
    onError: (error) => {
      logger.error('Hook: Mutation error occurred:', error);
      
      // Show error notification
      toast({
        title: "Update failed",
        description: "Failed to update notebook. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    updateNotebook: updateNotebook.mutate,
    updateNotebookAsync: updateNotebook.mutateAsync,
    isUpdating: updateNotebook.isPending,
    error: updateNotebook.error,
  };
};