import { IFileStorageService } from '@/services/interfaces/fileStorage.interface';
import { SupabaseFileStorageService } from '@/services/supabase-file-storage.service';

export class FileStorageFactory {
  static createFileStorageService(): IFileStorageService {
    return new SupabaseFileStorageService();
  }
}