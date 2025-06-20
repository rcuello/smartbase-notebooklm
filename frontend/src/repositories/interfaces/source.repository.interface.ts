/**
 * Datos de entrada para crear una fuente
 */
export interface CreateSourceData {
  notebookId: string;
  title: string;
  type: 'pdf' | 'text' | 'website' | 'youtube' | 'audio';
  content?: string;
  url?: string;
  file_path?: string;
  file_size?: number;
  processing_status?: string;
  metadata?: any;
}

/**
 * Datos de entrada para actualizar una fuente
 */
export interface UpdateSourceData {
  title?: string;
  file_path?: string;
  processing_status?: string;
}

/**
 * Estructura de datos de una fuente
 */
export interface SourceData {
  id: string;
  notebook_id: string;
  title: string;
  type: 'pdf' | 'text' | 'website' | 'youtube' | 'audio';
  content?: string;
  url?: string;
  file_path?: string;
  file_size?: number;
  processing_status?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Interfaz del repositorio de fuentes
 * Define las operaciones básicas de persistencia para fuentes
 */
export interface SourceRepositoryInterface {
  /**
   * Obtiene todas las fuentes de un notebook
   */
  getSourcesByNotebook(notebookId: string): Promise<SourceData[]>;

  /**
   * Obtiene una fuente por su ID
   */
  getSourceById(sourceId: string): Promise<SourceData>;

  /**
   * Crea una nueva fuente
   */
  createSource(sourceData: CreateSourceData): Promise<SourceData>;

  /**
   * Actualiza una fuente existente
   */
  updateSource(sourceId: string, updates: UpdateSourceData): Promise<SourceData>;

  /**
   * Elimina una fuente
   */
  deleteSource(sourceId: string): Promise<void>;

  /**
   * Configura suscripción en tiempo real para cambios en fuentes
   */
  subscribeToSourceChanges(
    notebookId: string,
    onSourceChange: (event: string, source: SourceData) => void
  ): () => void;
}