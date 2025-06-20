import { supabase } from "@/integrations/supabase/client";
import { INoteRepository, NoteCreateData, NoteData, NoteFilters, NoteQueryOptions, NoteUpdateData } from "@/repositories/interfaces/note.repository.interface";
import { logger } from '@/services/logger';

/**
 * Implementación de repositorio para notas usando Supabase
 * Encapsula toda la lógica de persistencia específica de Supabase
 */
export class SupabaseNoteRepository implements INoteRepository {
  /**
   * Crea una nueva nota en la base de datos
   */
  async create(data: NoteCreateData): Promise<NoteData> {

    logger.info('Creating note:', { title: data.title });

    const { data: result, error } = await supabase
      .from('notes')
      .insert([{
        notebook_id: data.notebook_id,
        title: data.title,
        content: data.content,
        source_type: data.source_type || 'user',
        extracted_text: data.extracted_text,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result as NoteData;
  }

  /**
   * Actualiza una nota existente
   */
  async update(id: string, updates: NoteUpdateData): Promise<NoteData> {
    const updateData: any = { ...updates };

     logger.info('Updating note wtf:', { id, updateData });
    
    // Siempre actualizar timestamp cuando se modifica
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NoteData;
  }

  /**
   * Elimina una nota por su ID
   */
  async delete(id: string): Promise<void> {
    logger.info('Deleting note:', { id });

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Cuenta las notas que coinciden con los filtros
   */
  async count(filters?: NoteFilters): Promise<number> {
    logger.info('Counting notes with filters:', filters);

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact', head: true });

    if (filters?.notebookId) {
      query = query.eq('notebook_id', filters.notebookId);
    }

    if (filters?.sourceType) {
      query = query.eq('source_type', filters.sourceType);
    }

    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  }

  /**
   * Obtiene múltiples notas con filtros y opciones de consulta
   */
  async findMany(filters?: NoteFilters, options?: NoteQueryOptions): Promise<NoteData[]> {
    let query = supabase.from('notes').select('*');

    logger.info('Fetching notes with filters wtf:', { filters, options });

    // Aplicar filtros
    if (filters?.notebookId) {
      query = query.eq('notebook_id', filters.notebookId);
    }

    if (filters?.sourceType) {
      query = query.eq('source_type', filters.sourceType);
    }

    // Aplicar ordenamiento
    const orderBy = options?.orderBy || 'updated_at';
    const orderDirection = options?.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Aplicar paginación
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as NoteData[];
  }

  /**
   * Obtiene una nota específica por ID
   */
  async findById(id: string, options?: NoteQueryOptions): Promise<NoteData | null> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    
    return data as NoteData;
  }

  /**
   * Obtiene todas las notas de un notebook específico (compatibilidad hacia atrás)
   */
  async findByNotebookId(notebookId: string): Promise<NoteData[]> {
    return this.findMany(
      { notebookId },
      { orderBy: 'updated_at', orderDirection: 'desc' }
    );
  }
}