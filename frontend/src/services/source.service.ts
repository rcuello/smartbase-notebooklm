import { logger } from '@/services/logger';
import {
  SourceRepositoryInterface,
  SourceData,
  CreateSourceData,
  UpdateSourceData,
} from '@/repositories/interfaces/source.repository.interface';
import { IFileStorageService } from './interfaces/file-storage.interface';

/**
 * Servicio de fuentes que encapsula la lógica de negocio
 * Actúa como capa intermedia entre el hook y el repositorio
 */
export class SourceService {
  constructor(
    private sourceRepository: SourceRepositoryInterface,
    private fileStorageService?: IFileStorageService
  ) {}

  /**
   * Obtiene una fuente específica por su ID
   */
  async getSourceById(sourceId: string): Promise<SourceData> {
    if (!sourceId) {
      throw new Error('Source ID is required');
    }

    try {
      return await this.sourceRepository.getSourceById(sourceId);
    } catch (error) {
      logger.error('Service error in getSourceById:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las fuentes de un notebook
   */
  async getSourcesByNotebook(notebookId: string): Promise<SourceData[]> {
    if (!notebookId) {
      throw new Error('Notebook ID is required');
    }

    try {
      return await this.sourceRepository.getSourcesByNotebook(notebookId);
    } catch (error) {
      logger.error('Service error in getSourcesByNotebook:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva fuente con validaciones de negocio
   */
  async createSource(sourceData: CreateSourceData): Promise<SourceData> {
    // Validaciones de negocio
    this.validateCreateSourceData(sourceData);

    try {
      const createdSource = await this.sourceRepository.createSource(sourceData);
      logger.info('Source created successfully via service:', createdSource.id);
      return createdSource;
    } catch (error) {
      logger.error('Service error in createSource:', error);
      throw error;
    }
  }

  /**
   * Actualiza una fuente existente
   */
  async updateSource(sourceId: string, updates: UpdateSourceData): Promise<SourceData> {
    if (!sourceId) {
      throw new Error('Source ID is required');
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      const updatedSource = await this.sourceRepository.updateSource(sourceId, updates);
      logger.info('Source updated successfully via service:', sourceId);
      return updatedSource;
    } catch (error) {
      logger.error('Service error in updateSource:', error);
      throw error;
    }
  }

  /**
   * Elimina una fuente con validaciones de negocio y manejo de archivos
   */
  async deleteSource(sourceId: string): Promise<SourceData> {
    if (!sourceId) {
      throw new Error('Source ID is required');
    }

    try {
      // Primero obtiene los detalles de la fuente antes de eliminarla
      const sourceToDelete = await this.sourceRepository.getSourceById(sourceId);
      logger.info('Found source to delete:', sourceToDelete.title, 'with file_path:', sourceToDelete.file_path);

      // Elimina el archivo del almacenamiento si existe y hay servicio de archivos
      if (sourceToDelete.file_path && this.fileStorageService) {
        try {
          logger.info('Deleting file from storage:', sourceToDelete.file_path);
          await this.fileStorageService.deleteFile(sourceToDelete.file_path);
          logger.info('File deleted successfully from storage');
        } catch (storageError) {
          logger.error('Error deleting file from storage:', storageError);
          // No lanza error aquí - aún queremos eliminar el registro de la base de datos
          // aunque el archivo ya no exista
        }
      } else {
        logger.info('No file to delete from storage (URL-based source or no file_path)');
      }

      // Elimina la fuente del repositorio
      await this.sourceRepository.deleteSource(sourceId);
      
      logger.info('Source deleted successfully via service:', sourceId);
      return sourceToDelete;
    } catch (error) {
      logger.error('Service error in deleteSource:', error);
      throw error;
    }
  }

  /**
   * Configura suscripción en tiempo real para cambios en fuentes
   */
  subscribeToSourceChanges(
    notebookId: string,
    onSourceChange: (event: string, source: SourceData) => void
  ): () => void {
    if (!notebookId) {
      throw new Error('Notebook ID is required for subscription');
    }

    return this.sourceRepository.subscribeToSourceChanges(notebookId, onSourceChange);
  }

  /**
   * Determina si una fuente está lista para la generación de contenido
   */
  canSourceTriggerGeneration(source: SourceData): boolean {
    return (
      (source.type === 'pdf' && !!source.file_path) ||
      (source.type === 'text' && !!source.content) ||
      (source.type === 'website' && !!source.url) ||
      (source.type === 'youtube' && !!source.url) ||
      (source.type === 'audio' && !!source.file_path)
    );
  }

  /**
   * Validaciones privadas para la creación de fuentes
   */
  private validateCreateSourceData(sourceData: CreateSourceData): void {
    if (!sourceData.notebookId) {
      throw new Error('Notebook ID is required');
    }

    if (!sourceData.title?.trim()) {
      throw new Error('Title is required'); 
    }

    if (!sourceData.type) {
      throw new Error('Source type is required');
    }

    const validTypes = ['pdf', 'text', 'website', 'youtube', 'audio'];
    if (!validTypes.includes(sourceData.type)) {
      throw new Error(`Invalid source type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validaciones específicas por tipo
    switch (sourceData.type) {
      case 'text':
        if (!sourceData.content?.trim()) {
          throw new Error('Content is required for text sources');
        }
        break;
      case 'website':
      case 'youtube':
        if (!sourceData.url?.trim()) {
          throw new Error(`URL is required for ${sourceData.type} sources`);
        }
        break;
      case 'pdf':
      case 'audio':
        // Para estos tipos, el file_path puede ser agregado después mediante update
        break;
    }
  }
}
