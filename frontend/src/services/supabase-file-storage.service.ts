import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';
import { IFileStorageService } from '@/services/interfaces/fileStorage.interface';

/**
 * Implementación del servicio de almacenamiento de archivos usando Supabase Storage
 * Encapsula toda la lógica específica de Supabase para operaciones con archivos
 */
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

  /**
   * Elimina un archivo del almacenamiento de Supabase
   */
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

  /**
   * Elimina múltiples archivos del almacenamiento de Supabase
   */
  async deleteFiles(filePaths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove(filePaths);

      if (error) {
        logger.error('Error deleting files from Supabase storage:', error);
        throw new Error(`Failed to delete files: ${error.message}`);
      }

      logger.info('Files deleted successfully from Supabase storage:', filePaths.length);
    } catch (error) {
      logger.error('Storage service error in deleteFiles:', error);
      throw error;
    }
  }

  /**
   * Verifica si un archivo existe en el almacenamiento de Supabase
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        });

      if (error) {
        logger.error('Error checking file existence in Supabase storage:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error('Storage service error in fileExists:', error);
      return false;
    }
  }
}