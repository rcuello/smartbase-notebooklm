import {
  SourceData,
} from '@/repositories/interfaces/source.repository.interface';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';

export type SourceChangeHandler = (event: string, source: SourceData) => void;

export class SourceRealtimeSubscriptionManager {
  private static readonly TABLE_NAME = 'sources';
  private static readonly SCHEMA = 'public';

  /**
   * Suscribe a cambios en fuentes de un notebook específico
   */
  subscribeToNotebookSources(
    notebookId: string,
    onChange: SourceChangeHandler
  ): () => void {
    const channelName = this.buildChannelName(notebookId);
    const filter = this.buildNotebookFilter(notebookId); 

    logger.info('Setting up realtime subscription for notebook sources OMG:', notebookId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: SourceRealtimeSubscriptionManager.SCHEMA,
          table: SourceRealtimeSubscriptionManager.TABLE_NAME,
          filter: filter,
        },
        (payload) => this.handlePayload(payload, onChange)
      )
      .subscribe((status) => this.handleSubscriptionStatus(status));

    return () => this.cleanup(channel);
  }

  /**
   * Construye el nombre del canal de suscripción
   */
  private buildChannelName(notebookId: string): string {
    return `sources-changes-${notebookId}`;
  }

  /**
   * Construye el filtro para el notebook específico
   */
  private buildNotebookFilter(notebookId: string): string {
    return `notebook_id=eq.${notebookId}`;
  }

  /**
   * Maneja el payload recibido del realtime
   */
  private handlePayload(payload: any, onChange: SourceChangeHandler): void {
    logger.info('Realtime: Sources event received', payload);

    const { eventType, new: newData, old: oldData } = payload;
    const sourceData = newData || oldData;

    if (sourceData) {
      onChange(eventType, sourceData as SourceData);
    } else {
      logger.warn('No source data found in realtime payload');
    }
  }

  /**
   * Maneja el estado de la suscripción
   */
  private handleSubscriptionStatus(status: string): void {
    logger.info(`Realtime subscription status: ${status}`);
  }

  /**
   * Limpia la suscripción
   */
  private cleanup(channel: any): void {
    logger.info('Unsubscribing from sources realtime channel');
    supabase.removeChannel(channel);
  }
}