import { supabase } from '@/integrations/supabase/client';
import { INotebookRepository, NotebookUpdateData, NotebookData } from '@/repositories/interfaces/notebook.repository.interface';
import { logger } from '@/services/logger';

export class SupabaseNotebookRepository implements INotebookRepository {
  
  async update(id: string, updates: NotebookUpdateData): Promise<NotebookData> {
    logger.info('Updating notebook:', { id, updates });
    
    const { data, error } = await supabase
      .from('notebooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating notebook:', error);
      throw error;
    }
    
    logger.info('Notebook updated successfully:', data);
    return data;
  }

  async create(data: Omit<NotebookData, 'id' | 'created_at' | 'updated_at'>): Promise<NotebookData> {
    logger.info('Creating notebook:', data);
    
    const { data: createdData, error } = await supabase
      .from('notebooks')
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error('Error creating notebook:', error);
      throw error;
    }
    
    logger.info('Notebook created successfully:', createdData);
    return createdData;
  }

  async delete(id: string): Promise<void> {
    logger.info('Deleting notebook:', { id });
    
    const { error } = await supabase
      .from('notebooks')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting notebook:', error);
      throw error;
    }
    
    logger.info('Notebook deleted successfully:', { id });
  }
}