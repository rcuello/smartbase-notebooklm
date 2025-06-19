export interface IFileStorageService {
  uploadFile(file: File, path: string): Promise<{ url: string; path: string }>;
  generateSignedUrl(path: string, expiresIn?: number): Promise<string>;
  deleteFile(path: string): Promise<void>;
}