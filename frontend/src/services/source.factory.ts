import { SourceService } from './source.service';
import { SupabaseSourceRepository } from '@/repositories/supabase-source.repository';

/**
 * Factory para crear instancias del servicio de fuentes con sus dependencias
 * Implementa el patrón Factory para encapsular la creación de objetos complejos
 */
export class SourceFactory {
  /**
   * Crea una instancia del servicio de fuentes con todas sus dependencias configuradas
   * Actualmente usa Supabase como repositorio por defecto
   */
  static createSourceService(): SourceService {
    // Crea la instancia del repositorio de Supabase
    const sourceRepository = new SupabaseSourceRepository();
    
    // Crea y retorna el servicio inyectando el repositorio
    return new SourceService(sourceRepository);
  }

  /**
   * Método para crear el servicio con un repositorio personalizado
   * Útil para testing o para cambiar el proveedor de persistencia
   */
  static createSourceServiceWithRepository(repository: any): SourceService {
    return new SourceService(repository);
  }
}