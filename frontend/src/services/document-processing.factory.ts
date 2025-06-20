import { SupabaseDocumentProcessingService } from '@/services/supabase-document-processing.service';
import { IDocumentProcessingService } from '@/services/interfaces/document-processing.interface';

export class DocumentProcessingFactory {
  static create(): IDocumentProcessingService {
    return new SupabaseDocumentProcessingService();
  }
}