import { 
  INotebookRepository, 
  NotebookUpdateData, 
  NotebookData, 
  NotebookCreateData,
  NotebookFilters,
  NotebookQueryOptions
} from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';

export interface NotebookServiceError extends Error {
  code?: string;
  details?: unknown;
}

export class NotebookService {
  constructor(private notebookRepository: INotebookRepository) {}

  /**
   * Fetches notebooks for a user with optional filtering and pagination
   * @param userId - User ID to fetch notebooks for
   * @param options - Query options and filters
   * @returns Promise with notebooks array
   */
  async getUserNotebooks(
    userId: string, 
    options?: {
      status?: 'pending' | 'processing' | 'completed' | 'error';
      includeSources?: boolean;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'title';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<NotebookData[]> {
    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    const filters: NotebookFilters = {
      userId,
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    };

    const queryOptions: NotebookQueryOptions = {
      includeSources: options?.includeSources ?? true,
      orderBy: options?.orderBy || 'updated_at',
      orderDirection: options?.orderDirection || 'desc',
    };

    logger.info('Fetching user notebooks:', { userId, filters, queryOptions });
    
    try {
      return await this.notebookRepository.findMany(filters, queryOptions);
    } catch (error) {
      logger.error('Failed to fetch user notebooks:', { userId, error });
      throw this.createError('Failed to fetch notebooks', 'FETCH_FAILED', error);
    }
  }

  /**
   * Fetches a single notebook by ID with user validation
   * @param id - Notebook ID
   * @param userId - User ID for authorization
   * @param includeSources - Whether to include source counts
   * @returns Promise with notebook data or null if not found/unauthorized
   */
  async getNotebook(id: string, userId: string, includeSources = true): Promise<NotebookData | null> {
    if (!id?.trim()) {
      throw this.createError('Notebook ID is required', 'INVALID_NOTEBOOK_ID');
    }

    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    logger.info('Fetching notebook:', { id, userId, includeSources });
    
    try {
      const notebook = await this.notebookRepository.findById(id, { includeSources });
      
      // Check authorization
      if (notebook && notebook.user_id !== userId) {
        logger.warn('Unauthorized notebook access attempt:', { id, userId, ownerId: notebook.user_id });
        return null; // Don't expose existence of notebook to unauthorized users
      }

      return notebook;
    } catch (error) {
      logger.error('Failed to fetch notebook:', { id, userId, error });
      throw this.createError('Failed to fetch notebook', 'FETCH_FAILED', error);
    }
  }

  /**
   * Updates a notebook with validation and authorization
   * @param id - Notebook ID to update
   * @param userId - User ID for authorization
   * @param updates - Data to update
   * @returns Promise with updated notebook data
   */
  /*async updateNotebook(id: string, userId: string, updates: NotebookUpdateData): Promise<NotebookData> {
    if (!id?.trim()) {
      throw this.createError('Notebook ID is required', 'INVALID_NOTEBOOK_ID');
    }

    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw this.createError('At least one field to update is required', 'NO_UPDATES');
    }

    // Verify ownership before updating
    const existingNotebook = await this.getNotebook(id, userId, false);
    if (!existingNotebook) {
      throw this.createError('Notebook not found or access denied', 'NOT_FOUND');
    }

    // Clean and validate updates
    const cleanUpdates = this.sanitizeUpdateData(updates);

    logger.info('Updating notebook:', { id, userId, updates: cleanUpdates });
    
    try {
      return await this.notebookRepository.update(id, cleanUpdates);
    } catch (error) {
      logger.error('Failed to update notebook:', { id, userId, error });
      throw this.createError('Failed to update notebook', 'UPDATE_FAILED', error);
    }
  }*/

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
   * Creates a new notebook with validation
   * @param data - Notebook data to create
   * @returns Promise with created notebook data
   */
  async createNotebook(data: NotebookCreateData): Promise<NotebookData> {
    // Validate required fields
    if (!data.title?.trim()) {
      throw this.createError('Notebook title is required', 'INVALID_TITLE');
    }

    if (!data.user_id?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    const cleanData: NotebookCreateData = {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      user_id: data.user_id,
      generation_status: data.generation_status || 'pending',
    };

    logger.info('Creating notebook:', { title: cleanData.title, userId: cleanData.user_id });
    
    try {
      return await this.notebookRepository.create(cleanData);
    } catch (error) {
      logger.error('Failed to create notebook:', { data: cleanData, error });
      throw this.createError('Failed to create notebook', 'CREATE_FAILED', error);
    }
  }

  /**
   * Deletes a notebook with authorization check
   * @param id - Notebook ID to delete
   * @param userId - User ID for authorization
   * @returns Promise with void
   */
  async deleteNotebook(id: string, userId: string): Promise<void> {
    if (!id?.trim()) {
      throw this.createError('Notebook ID is required', 'INVALID_NOTEBOOK_ID');
    }

    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    // Verify ownership before deleting
    const existingNotebook = await this.getNotebook(id, userId, false);
    if (!existingNotebook) {
      throw this.createError('Notebook not found or access denied', 'NOT_FOUND');
    }

    logger.info('Deleting notebook wtf:', { id, userId });
    
    try {
      await this.notebookRepository.delete(id);
    } catch (error) {
      logger.error('Failed to delete notebook:', { id, userId, error });
      throw this.createError('Failed to delete notebook', 'DELETE_FAILED', error);
    }
  }

  /**
   * Gets notebook count for a user
   * @param userId - User ID
   * @param status - Optional status filter
   * @returns Promise with count number
   */
  async getUserNotebookCount(
    userId: string, 
    status?: 'pending' | 'processing' | 'completed' | 'error'
  ): Promise<number> {
    if (!userId?.trim()) {
      throw this.createError('User ID is required', 'INVALID_USER_ID');
    }

    const filters: NotebookFilters = { userId, status };

    logger.info('Counting user notebooks:', { userId, status });
    
    try {
      return await this.notebookRepository.count(filters);
    } catch (error) {
      logger.error('Failed to count notebooks:', { userId, status, error });
      throw this.createError('Failed to count notebooks', 'COUNT_FAILED', error);
    }
  }

  /**
   * Private method to sanitize update data
   * @param updates - Raw update data
   * @returns Cleaned update data
   */
  private sanitizeUpdateData(updates: NotebookUpdateData): NotebookUpdateData {
    const cleanUpdates: NotebookUpdateData = {};
    
    if (updates.title !== undefined) {
      const trimmedTitle = updates.title.trim();
      if (!trimmedTitle) {
        throw this.createError('Title cannot be empty', 'INVALID_TITLE');
      }
      cleanUpdates.title = trimmedTitle;
    }
    
    if (updates.description !== undefined) {
      cleanUpdates.description = updates.description.trim();
    }

    if (updates.generation_status !== undefined) {
      const validStatuses = ['pending', 'processing', 'completed', 'error'];
      if (!validStatuses.includes(updates.generation_status)) {
        throw this.createError('Invalid generation status', 'INVALID_STATUS');
      }
      cleanUpdates.generation_status = updates.generation_status;
    }

    return cleanUpdates;
  }

  /**
   * Private method to create standardized errors
   * @param message - Error message
   * @param code - Error code
   * @param originalError - Original error if any
   * @returns NotebookServiceError
   */
  private createError(message: string, code: string, originalError?: unknown): NotebookServiceError {
    const error = new Error(message) as NotebookServiceError;
    error.code = code;
    error.details = originalError;
    return error;
  }
}