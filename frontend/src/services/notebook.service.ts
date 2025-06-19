import { INotebookRepository, NotebookUpdateData, NotebookData } from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';

export class NotebookService {
  constructor(private notebookRepository: INotebookRepository) {}

  /**
   * Updates a notebook with validation and business logic
   * @param id - Notebook ID to update
   * @param updates - Data to update
   * @returns Promise with updated notebook data
   */
  async updateNotebook(id: string, updates: NotebookUpdateData): Promise<NotebookData> {
    // Validate input
    if (!id?.trim()) {
      throw new Error('Notebook ID is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one field to update is required');
    }

    // Trim string values if present
    const cleanUpdates: NotebookUpdateData = {};
    if (updates.title !== undefined) {
      cleanUpdates.title = updates.title.trim();
    }
    if (updates.description !== undefined) {
      cleanUpdates.description = updates.description.trim();
    }

    logger.info('Processing notebook update:', { id, updates: cleanUpdates });
    
    try {
      return await this.notebookRepository.update(id, cleanUpdates);
    } catch (error) {
      logger.error('Failed to update notebook:', { id, error });
      throw error;
    }
  }

  /**
   * Creates a new notebook
   * @param data - Notebook data to create
   * @returns Promise with created notebook data
   */
  async createNotebook(data: Omit<NotebookData, 'id' | 'created_at' | 'updated_at'>): Promise<NotebookData> {
    // Validate required fields
    if (!data.title?.trim()) {
      throw new Error('Notebook title is required');
    }

    if (!data.user_id?.trim()) {
      throw new Error('User ID is required');
    }

    const cleanData = {
      ...data,
      title: data.title.trim(),
      description: data.description?.trim() || '',
    };

    logger.info('Processing notebook creation:', cleanData);
    
    try {
      return await this.notebookRepository.create(cleanData);
    } catch (error) {
      logger.error('Failed to create notebook:', { data: cleanData, error });
      throw error;
    }
  }

  /**
   * Deletes a notebook
   * @param id - Notebook ID to delete
   * @returns Promise with void
   */
  async deleteNotebook(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('Notebook ID is required');
    }

    logger.info('Processing notebook deletion:', { id });
    
    try {
      await this.notebookRepository.delete(id);
    } catch (error) {
      logger.error('Failed to delete notebook:', { id, error });
      throw error;
    }
  }
}