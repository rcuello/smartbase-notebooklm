export interface NoteData {
  id: string;
  notebook_id: string;
  title: string;
  content: string;
  source_type: 'user' | 'ai_response';
  extracted_text?: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreateData {
  notebook_id: string;
  title: string;
  content: string;
  source_type?: 'user' | 'ai_response';
  extracted_text?: string;
}

export interface NoteUpdateData {
  title?: string;
  content?: string;
}

export interface NoteFilters {
  notebookId?: string;
  sourceType?: 'user' | 'ai_response';
  limit?: number;
  offset?: number;
}

export interface NoteQueryOptions {
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'asc' | 'desc';
}

export interface INoteRepository {
  /**
   * Creates a new note
   * @param data - The note data to create
   * @returns Promise with the created note data
   */
  create(data: NoteCreateData): Promise<NoteData>;

  /**
   * Updates a note with the provided data
   * @param id - The note ID to update
   * @param updates - The data to update
   * @returns Promise with the updated note data
   */
  update(id: string, updates: NoteUpdateData): Promise<NoteData>;

  /**
   * Deletes a note by ID
   * @param id - The note ID to delete
   * @returns Promise with void
   */
  delete(id: string): Promise<void>;

  /**
   * Counts notes matching the filters
   * @param filters - Filtering criteria
   * @returns Promise with count number
   */
  count(filters?: NoteFilters): Promise<number>;

  /**
   * Fetches notes with optional filters and query options
   * @param filters - Filtering criteria
   * @param options - Query options like ordering and includes
   * @returns Promise with array of notes
   */
  findMany(filters?: NoteFilters, options?: NoteQueryOptions): Promise<NoteData[]>;

  /**
   * Fetches a single note by ID
   * @param id - The note ID
   * @param options - Query options
   * @returns Promise with note data or null if not found
   */
  findById(id: string, options?: NoteQueryOptions): Promise<NoteData | null>;

  /**
   * Fetches all notes by notebook ID (backward compatibility)
   * @param notebookId - The notebook ID
   * @returns Promise with array of notes
   */
  findByNotebookId(notebookId: string): Promise<NoteData[]>;
}