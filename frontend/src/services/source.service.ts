import { logger } from '@/services/logger';
import { 
  SourceRepositoryInterface,
  SourceData,
  CreateSourceData,
  UpdateSourceData,
} from '@/repositories/interfaces/source.repository.interface';

/**
 * Servicio de fuentes que encapsula la lógica de negocio
 * Actúa como capa intermedia entre el hook y el repositorio
 */
export class SourceService {
  constructor(private sourceRepository: SourceRepositoryInterface) {}

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