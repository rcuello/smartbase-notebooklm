import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { NoteFactory } from '@/services/note.factory';
//import { NoteData } from '@/repositories/supabase-note.repository';
import { NoteService } from '@/services/note.service';
import { NoteData } from '@/repositories/interfaces/note.repository.interface';

/**
 * Hook personalizado para la gestión de notas
 * Utiliza el patrón de inyección de dependencias a través del factory
 */
export const useNotes = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Instancia del servicio de notas creada mediante factory 
  const noteService: NoteService = useMemo(() => {
      return NoteFactory.createNoteService();
    }, []);

  /**
   * Query para obtener las notas de un notebook
   */
  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', notebookId],
    queryFn: () => noteService.getNotesByNotebook(notebookId!),
    enabled: !!notebookId && !!user,
  });

  /**
   * Mutación para crear una nueva nota
   */
  const createNoteMutation = useMutation({
    mutationFn: async ({ 
      title, 
      content, 
      source_type = 'user',
      extracted_text 
    }: { 
      title: string; 
      content: string; 
      source_type?: 'user' | 'ai_response';
      extracted_text?: string;
    }) => {
      return noteService.createNote({
        notebookId: notebookId!,
        title,
        content,
        source_type,
        extracted_text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  /**
   * Mutación para actualizar una nota existente
   */
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      return noteService.updateNote({ id, title, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  /**
   * Mutación para eliminar una nota
   */
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return noteService.deleteNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    },
  });

  return {
    notes,
    isLoading,
    createNote: createNoteMutation.mutate,
    isCreating: createNoteMutation.isPending,
    updateNote: updateNoteMutation.mutate,
    isUpdating: updateNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutate,
    isDeleting: deleteNoteMutation.isPending,
  };
};

// Re-exportamos el tipo NoteData para mantener compatibilidad
export type { NoteData };

// Alias para compatibilidad hacia atrás
export type Note = NoteData;