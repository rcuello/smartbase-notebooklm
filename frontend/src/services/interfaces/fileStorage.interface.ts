/**
 * Interfaz para servicios de almacenamiento de archivos
 * Define las operaciones básicas para manejo de archivos
 */
export interface IFileStorageService {
  /**
   * Sube un archivo al almacenamiento
   */
  uploadFile(file: File, path: string): Promise<{ url: string; path: string }>;
  /**
   * Genera una URL firmada para acceder a un archivo
   * @param path Ruta del archivo en el almacenamiento
   * @param expiresIn Tiempo de expiración en segundos (opcional, por defecto 3600)
   */
  generateSignedUrl(path: string, expiresIn?: number): Promise<string>;
  /**
   * Elimina un archivo del almacenamiento
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Elimina múltiples archivos del almacenamiento
   */
  deleteFiles(filePaths: string[]): Promise<void>;

  /**
   * Verifica si un archivo existe en el almacenamiento
   */
  fileExists(filePath: string): Promise<boolean>;
}