import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotebookFactory } from '@/services/notebook.factory';
import { NotebookCreateData } from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/use-toast';
import { NotebookService } from '@/services/notebook.service';

interface UseNotebooksOptions {
  status?: 'pending' | 'processing' | 'completed' | 'error';
  includeSources?: boolean;
  limit?: number;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'asc' | 'desc';
  enableRealtime?: boolean;
}

export const useNotebooks = (options: UseNotebooksOptions = {}) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Create service instance using factory pattern
  //const notebookService = NotebookFactory.createNotebookService();
  const notebookService: NotebookService = useMemo(() => {
        return NotebookFactory.createNotebookService();
      }, []);

  // Default options
  const {
    status,
    includeSources = true,
    limit,
    orderBy = 'updated_at',
    orderDirection = 'desc',
    enableRealtime = true,
  } = options;

  // Query key factory for better cache management
  const getQueryKey = useCallback(() => [
    'notebooks', 
    user?.id, 
    { status, includeSources, limit, orderBy, orderDirection }
  ], [user?.id, status, includeSources, limit, orderBy, orderDirection]);

  const {
    data: notebooks = [],
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      if (!user?.id) {
        logger.info('No authenticated user, returning empty notebooks array');
        return [];
      }
      
      logger.info('Fetching notebooks for user wtf:', { 
        userId: user.id, 
        options: { status, includeSources, limit, orderBy, orderDirection }
      });
      
      try {
        return await notebookService.getUserNotebooks(user.id, {
          status,
          includeSources,
          limit,
          orderBy,
          orderDirection,
        });
      } catch (error) {
        logger.error('Failed to fetch notebooks:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !authLoading && !!user?.id,
    retry: (failureCount, error) => {
      // Don't retry on auth errors or client errors
      const errorMessage = error?.message?.toLowerCase() || '';
      if (
        errorMessage.includes('jwt') || 
        errorMessage.includes('auth') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden')
      ) {
        logger.warn('Auth error detected, not retrying:', error);
        return false;
      }
      return failureCount < 2; // Reduced retry count
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });

  // Real-time subscription setup
  useEffect(() => {
    if (!user?.id || !isAuthenticated || !enableRealtime) return;

    logger.info('Setting up real-time subscription for notebooks');

    const channel = supabase
      .channel(`notebooks-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebooks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.info('Real-time notebook update received:', { 
            event: payload.eventType, 
            //payload: payload.new?.id || payload.old?.id 
          });
          
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ 
            queryKey: ['notebooks', user.id],
            exact: false // Invalidate all variations of the query
          });

          // Show notification for certain events
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New notebook created",
              description: `"${payload.new?.title}" has been added to your collection.`,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Real-time subscription established');
        } else if (status === 'CLOSED') {
          logger.info('Real-time subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Real-time subscription error');
        }
      });

    return () => {
      logger.info('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated, enableRealtime, queryClient, toast]);

  const createNotebook = useMutation({
    mutationFn: async (notebookData: Omit<NotebookCreateData, 'user_id'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      logger.info('Creating notebook:', { 
        title: notebookData.title, 
        userId: user.id 
      });
      
      const createData: NotebookCreateData = {
        ...notebookData,
        user_id: user.id,
      };

      return await notebookService.createNotebook(createData);
    },
    onSuccess: (data) => {
      logger.info('Notebook created successfully:', data.id);
      
      // Invalidate and refetch notebooks
      queryClient.invalidateQueries({ 
        queryKey: ['notebooks', user?.id],
        exact: false
      });

      // Show success notification
      toast({
        title: "Notebook created",
        description: `"${data.title}" has been created successfully.`,
      });
    },
    onError: (error) => {
      logger.error('Failed to create notebook:', error);
      
      // Show error notification
      toast({
        title: "Creation failed",
        description: "Failed to create notebook. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Manual refresh function
  const refreshNotebooks = useCallback(async () => {
    logger.info('Manually refreshing notebooks');
    try {
      await refetch();
    } catch (error) {
      logger.error('Failed to refresh notebooks:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh notebooks. Please try again.",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  // Get notebook count
  const getNotebookCount = useCallback(async (statusFilter?: 'pending' | 'processing' | 'completed' | 'error') => {
    if (!user?.id) return 0;
    
    try {
      return await notebookService.getUserNotebookCount(user.id, statusFilter);
    } catch (error) {
      logger.error('Failed to get notebook count:', error);
      return 0;
    }
  }, [user?.id, notebookService]);

  return {
    // Data
    notebooks,
    
    // Loading states
    isLoading: authLoading || isLoading,
    isCreating: createNotebook.isPending,
    
    // Error states
    error: error?.message || null,
    isError,
    createError: createNotebook.error,
    
    // Actions
    createNotebook: createNotebook.mutate,
    createNotebookAsync: createNotebook.mutateAsync,
    refreshNotebooks,
    getNotebookCount,
    
    // Utils
    refetch,
  };
};