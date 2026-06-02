import {
  ComprasPublisher,
  PublishResult,
  SolicitudCompraCreadaEvent,
} from './compras-publisher';

export class InMemoryComprasPublisher implements ComprasPublisher {
  readonly events: SolicitudCompraCreadaEvent[] = [];

  publishSolicitudCreada(
    event: SolicitudCompraCreadaEvent,
  ): Promise<PublishResult> {
    this.events.push(structuredClone(event));

    return Promise.resolve({
      messageId: `test-${event.eventId}`,
    });
  }
}
