import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';
import { IFileStorageService } from '@/services/interfaces/fileStorage.interface';

export class SupabaseFileStorageService implements IFileStorageService {
  private bucketName: string;

  constructor(bucketName?: string) {
    this.bucketName = bucketName || import.meta.env.VITE_SUPABASE_BUCKET_SOURCE || 'sources';
  }

  async uploadFile(file: File, path: string): Promise<{ url: string; path: string }> {
    logger.debug('Uploading file to Supabase', { fileName: file.name, path });

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, file, { upsert: true });

    if (error) {
      logger.error('File upload failed', { error: error.message, path });
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    logger.info('File uploaded successfully', { path: data.path });

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  }

  async generateSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    logger.debug('Generating signed URL', { path, expiresIn });

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      logger.error('Failed to generate signed URL', { error: error.message, path });
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(path: string): Promise<void> {
    logger.debug('Deleting file', { path });

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      logger.error('Failed to delete file', { error: error.message, path });
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    logger.info('File deleted successfully', { path });
  }
}