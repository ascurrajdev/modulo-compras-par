import { DetalleSolicitud, Proveedor, SolicitudCompra } from '../compras.types';

export const COMPRAS_PUBLISHER = Symbol('COMPRAS_PUBLISHER');

export interface SolicitudCompraCreadaEvent {
  eventId: string;
  eventType: 'compras.solicitud-creada';
  occurredAt: string;
  solicitud: SolicitudCompra;
  proveedor: Proveedor;
  detalles: DetalleSolicitud[];
}

export interface PublishResult {
  messageId: string;
}

export interface ComprasPublisher {
  publishSolicitudCreada(
    event: SolicitudCompraCreadaEvent,
  ): Promise<PublishResult>;
}
