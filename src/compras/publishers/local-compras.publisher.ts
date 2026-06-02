import { randomUUID } from 'crypto';
import {
  ComprasPublisher,
  PublishResult,
  SolicitudCompraCreadaEvent,
} from './compras-publisher';

export class LocalComprasPublisher implements ComprasPublisher {
  publishSolicitudCreada(
    event: SolicitudCompraCreadaEvent,
  ): Promise<PublishResult> {
    return Promise.resolve({
      messageId: `local-${event.eventId || randomUUID()}`,
    });
  }
}
