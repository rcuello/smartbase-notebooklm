import { INoteRepository, NoteData, NoteCreateData, NoteUpdateData } from "@/repositories/interfaces/note.repository.interface";


/**
 * Servicio de dominio para la gestión de notas
 * Encapsula la lógica de negocio y actúa como intermediario entre el hook y el repositorio
 */
export class NoteService {
  constructor(private readonly noteRepository: INoteRepository) {}

  /**
   * Obtiene todas las notas de un notebook
   */
  async getNotesByNotebook(notebookId: string): Promise<NoteData[]> {
    if (!notebookId) {
      return [];
    }
    
    return this.noteRepository.findByNotebookId(notebookId);
  }

  /**
   * Crea una nueva nota
   */
  async createNote(params: {
    notebookId: string;
    title: string;
    content: string;
    source_type?: 'user' | 'ai_response';
    extracted_text?: string;
  }): Promise<NoteData> {
    if (!params.notebookId) {
      throw new Error('Notebook ID is required');
    }

    const createNoteDto: NoteCreateData = {
      notebook_id: params.notebookId,
      title: params.title,
      content: params.content,
      source_type: params.source_type || 'user',
      extracted_text: params.extracted_text,
    };

    return this.noteRepository.create(createNoteDto);
  }

  /**
   * Actualiza una nota existente
   */
  async updateNote(params: {
    id: string;
    title: string;
    content: string;
  }): Promise<NoteData> {
    const updateNoteDto: NoteUpdateData = {      
      title: params.title,
      content: params.content,
    };

    return this.noteRepository.update(params.id,updateNoteDto);
  }

  /**
   * Elimina una nota
   */
  async deleteNote(id: string): Promise<void> {
    return this.noteRepository.delete(id);
  }
}