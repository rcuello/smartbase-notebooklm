import { NoteService } from '@/services/note.service';
import { SupabaseNoteRepository } from '@/repositories/supabase-note.repository';

/**
 * Factory para crear instancias de NoteService con sus dependencias correctamente inyectadas
 * Implementa el patrón Factory para centralizar la creación de servicios
 */
export class NoteFactory {
  /**
   * Crea una instancia de NoteService con el repositorio de Supabase
   */
  static createNoteService(): NoteService {
    const noteRepository = new SupabaseNoteRepository();
    return new NoteService(noteRepository);
  }
}