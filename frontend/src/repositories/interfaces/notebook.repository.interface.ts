export interface NotebookUpdateData {
  title?: string;
  description?: string;
}

export interface NotebookData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface INotebookRepository {
  /**
   * Updates a notebook with the provided data
   * @param id - The notebook ID to update
   * @param updates - The data to update
   * @returns Promise with the updated notebook data
   */
  update(id: string, updates: NotebookUpdateData): Promise<NotebookData>;
  
  /**
   * Creates a new notebook
   * @param data - The notebook data to create
   * @returns Promise with the created notebook data
   */
  create(data: Omit<NotebookData, 'id' | 'created_at' | 'updated_at'>): Promise<NotebookData>;
  
  /**
   * Deletes a notebook by ID
   * @param id - The notebook ID to delete
   * @returns Promise with void
   */
  delete(id: string): Promise<void>;
}