import { randomUUID } from 'crypto';
import { Kafka, Producer } from 'kafkajs';
import {
  ComprasPublisher,
  PublishResult,
  SolicitudCompraCreadaEvent,
} from './compras-publisher';

export interface KafkaComprasPublisherOptions {
  brokers: string[];
  clientId: string;
  topicSolicitudes: string;
}

export class KafkaComprasPublisher implements ComprasPublisher {
  private readonly producer: Producer;
  private connected = false;

  constructor(private readonly options: KafkaComprasPublisherOptions) {
    const kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
    });

    this.producer = kafka.producer();
  }

  async publishSolicitudCreada(
    event: SolicitudCompraCreadaEvent,
  ): Promise<PublishResult> {
    await this.connect();

    const messageId = `msg-${randomUUID().slice(0, 18)}`;

    await this.producer.send({
      topic: this.options.topicSolicitudes,
      messages: [
        {
          key: String(event.solicitud.idSolicitud),
          value: JSON.stringify(event),
          headers: {
            eventId: event.eventId,
            eventType: event.eventType,
            messageId,
            occurredAt: event.occurredAt,
          },
        },
      ],
    });

    return { messageId };
  }

  private async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.producer.connect();
    this.connected = true;
  }
}
