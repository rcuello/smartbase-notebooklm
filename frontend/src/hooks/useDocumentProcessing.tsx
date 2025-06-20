import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DocumentProcessingFactory } from '@/services/document-processing.factory';
import { DocumentProcessingRequest, IDocumentProcessingService } from '@/services/interfaces/document-processing.interface';

export const useDocumentProcessing = () => {
  const { toast } = useToast();  

  const documentProcessingService: IDocumentProcessingService = useMemo(() => {
          return DocumentProcessingFactory.create();
        }, []);

  const processDocument = useMutation({
    mutationFn: async (request: DocumentProcessingRequest) => {
      return await documentProcessingService.processDocument(request);
    },
    onSuccess: (data) => {
      console.log('Document processing initiated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to initiate document processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start document processing. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    processDocumentAsync: processDocument.mutateAsync,
    processDocument: processDocument.mutate,
    isProcessing: processDocument.isPending,
  };
};