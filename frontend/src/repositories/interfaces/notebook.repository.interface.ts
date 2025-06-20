export enum NoteBookGenerationStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Error = 'error',
}

export interface NotebookUpdateData {
  title?: string;
  description?: string;
  generation_status?: NoteBookGenerationStatus;
}

export interface NotebookCreateData {
  title: string;
  description?: string;
  user_id: string;
  generation_status?: NoteBookGenerationStatus;
}

export interface NotebookData {
  id: string;
  title: string;
  description: string;
  audio_overview_url?: string;
  audio_url_expires_at?: string;
  audio_overview_generation_status?: NoteBookGenerationStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  generation_status: NoteBookGenerationStatus;
  sources?: Array<{ count: number }>;
}

export interface NotebookFilters {
  userId?: string;
  status?: NoteBookGenerationStatus;
  limit?: number;
  offset?: number;
}

export interface NotebookQueryOptions {
  includeSources?: boolean;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'asc' | 'desc';
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
  create(data: NotebookCreateData): Promise<NotebookData>;
  /**
   * Deletes a notebook by ID
   * @param id - The notebook ID to delete
   * @returns Promise with void
   */
  delete(id: string): Promise<void>;

  /**
   * Counts notebooks matching the filters
   * @param filters - Filtering criteria
   * @returns Promise with count number
   */
  count(filters?: NotebookFilters): Promise<number>;

  /**
   * Fetches notebooks with optional filters and query options
   * @param filters - Filtering criteria
   * @param options - Query options like ordering and includes
   * @returns Promise with array of notebooks
   */
  findMany(filters?: NotebookFilters, options?: NotebookQueryOptions): Promise<NotebookData[]>;
  
  /**
   * Fetches a single notebook by ID
   * @param id - The notebook ID
   * @param options - Query options
   * @returns Promise with notebook data or null if not found
   */
  findById(id: string, options?: NotebookQueryOptions): Promise<NotebookData | null>;
}