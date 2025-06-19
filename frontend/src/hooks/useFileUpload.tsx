import { useCallback, useMemo, useState } from 'react';

import { logger } from '@/services/logger';
import { FileStorageFactory } from '@/services/fileStorage.factory';
import { IFileStorageService } from '@/services/interfaces/fileStorage.interface';

interface FileUploadResponse {
  url: string;
  path: string;
}

interface UseFileUploadReturn {
  uploadFile: (file: File, notebookId: string, sourceId: string) => Promise<string>;
  generateSignedUrl: (path: string, expiresIn?: number) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  isUploading: boolean;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);

  const fileStorageService: IFileStorageService = useMemo(() => {
    return FileStorageFactory.createFileStorageService();
  }, []);

  const uploadFile = useCallback(async (file: File, notebookId: string, sourceId: string): Promise<string> => {
    setIsUploading(true);
    
    try {
      logger.info('Starting file upload', { fileName: file.name, fileSize: file.size, notebookId, sourceId });
      
      const filePath = `${notebookId}/${sourceId}/${file.name}`;
      const result = await fileStorageService.uploadFile(file, filePath);
      
      logger.info('File upload completed', { fileName: file.name, path: result.path });
      
      return result.path;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logger.error('File upload failed', { error: errorMessage, fileName: file.name });
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [fileStorageService]);

  const generateSignedUrl = useCallback(async (path: string, expiresIn?: number): Promise<string> => {
    try {
      return await fileStorageService.generateSignedUrl(path, expiresIn);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logger.error('Failed to generate signed URL', { error: errorMessage, path });
      
      throw error;
    }
  }, [fileStorageService]);

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    try {
      await fileStorageService.deleteFile(path);
      
      logger.info('File deleted successfully', { path });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logger.error('Failed to delete file', { error: errorMessage, path });
      
      throw error;
    }
  }, [fileStorageService]);

  return {
    uploadFile,
    generateSignedUrl,
    deleteFile,
    isUploading
  };
};