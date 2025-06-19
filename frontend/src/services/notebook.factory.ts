import { NotebookService } from '@/services/notebook.service';
import { SupabaseNotebookRepository } from '@/repositories/supabase-notebook.repository';
import { INotebookRepository } from '@/repositories/interfaces/notebook.repository.interface';

/**
 * Factory class to create notebook service instances with their dependencies
 * This allows for easy swapping of repository implementations in the future
 */
export class NotebookFactory {
  
  /**
   * Creates a notebook service instance with Supabase repository
   * @returns NotebookService instance configured with Supabase
   */
  static createNotebookService(): NotebookService {
    const repository: INotebookRepository = new SupabaseNotebookRepository();
    return new NotebookService(repository);
  }

  /**
   * Creates a notebook service instance with custom repository
   * Useful for testing or alternative storage implementations
   * @param repository - Custom repository implementation
   * @returns NotebookService instance configured with custom repository
   */
  static createNotebookServiceWithRepository(repository: INotebookRepository): NotebookService {
    return new NotebookService(repository);
  }
}