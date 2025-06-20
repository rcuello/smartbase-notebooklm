

/**
 * Datos para crear una nueva fuente
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
 * Datos para actualizar una fuente existente
 */
export interface UpdateSourceData {
  title?: string;
  content?: string;
  url?: string;
  file_path?: string;
  file_size?: number;
  processing_status?: string;
  metadata?: Record<string, any>;
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
 * Callback para manejar cambios en tiempo real de fuentes
 */
export type SourceChangeHandler = (eventType: string, sourceData: SourceData) => void;

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
   * Suscribe a cambios en tiempo real de fuentes de un notebook
   * @returns Función de limpieza para cancelar la suscripción
   */
  subscribeToSourceChanges(
    notebookId: string,
    onSourceChange: (event: string, source: SourceData) => void
  ): () => void;
}