import { IFileStorageService } from '@/services/interfaces/file-storage.interface';
import { SupabaseFileStorageService } from '@/services/supabase-file-storage.service';

export class FileStorageFactory {
  static createFileStorageService(): IFileStorageService {
    return new SupabaseFileStorageService();
  }
}