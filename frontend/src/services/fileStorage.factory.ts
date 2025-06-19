import { IFileStorageService } from '@/services/interfaces/fileStorage.interface';
import { SupabaseFileStorageService } from '@/services/supabaseFileStorage.service';

export class FileStorageFactory {
  static createFileStorageService(): IFileStorageService {
    return new SupabaseFileStorageService();
  }
}