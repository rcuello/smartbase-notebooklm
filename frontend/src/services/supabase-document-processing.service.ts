import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';
import { 
  IDocumentProcessingService, 
  DocumentProcessingRequest, 
  DocumentProcessingResponse 
} from '@/services/interfaces/document-processing.interface';

export class SupabaseDocumentProcessingService implements IDocumentProcessingService {
  async processDocument(request: DocumentProcessingRequest): Promise<DocumentProcessingResponse> {
    const { sourceId, filePath, sourceType } = request;
    
    logger.info('Initiating document processing', { sourceId, filePath, sourceType });

    const { data, error } = await supabase.functions.invoke('process-document-2', {
      body: {
        sourceId,
        filePath,
        sourceType
      }
    });

    if (error) {
      logger.error('Document processing error', error);
      throw error;
    }

    logger.info('Document processing initiated successfully', data);
    return data;
  }
}