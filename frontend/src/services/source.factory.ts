import { SourceService } from './source.service';
import { SupabaseSourceRepository } from '@/repositories/supabase-source.repository';
import { SupabaseFileStorageService } from '@/services/supabase-file-storage.service';

/**
 * Factory para crear instancias del servicio de fuentes con sus dependencias
 * Implementa el patrón Factory para encapsular la creación de objetos complejos
 */
export class SourceFactory {
  private static sourceServiceInstance: SourceService | null = null;
  /**
   * Crea una instancia del servicio de fuentes con todas sus dependencias configuradas
   * Actualmente usa Supabase como repositorio por defecto
   */
  static createSourceService(): SourceService {
    // Crea la instancia del repositorio de Supabase
    if (!this.sourceServiceInstance) {
      const sourceRepository = new SupabaseSourceRepository();

      // Crea la instancia del servicio de almacenamiento de archivos
      const fileStorageService = new SupabaseFileStorageService();

      this.sourceServiceInstance = new SourceService(sourceRepository, fileStorageService);
    }

    // Crea y retorna el servicio inyectando el repositorio
    return this.sourceServiceInstance;
  }

  /**
   * Método para crear el servicio con dependencias personalizadas
   * Útil para testing o para cambiar el proveedor de persistencia
   */
  static createSourceServiceWithDependencies(
    repository: any,
    fileStorageService?: any
  ): SourceService {
    return new SourceService(repository, fileStorageService);
  }

  /**
   * Resetea la instancia singleton (útil para testing)
   */
  static resetInstance(): void {
    this.sourceServiceInstance = null;
  }
}
