import { ConfigService } from '@nestjs/config';
import { COMPRAS_PUBLISHER, ComprasPublisher } from './compras-publisher';
import { KafkaComprasPublisher } from './kafka-compras.publisher';
import { LocalComprasPublisher } from './local-compras.publisher';

export const comprasPublisherProvider = {
  provide: COMPRAS_PUBLISHER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): ComprasPublisher => {
    const enabled = configService.get<string>('KAFKA_ENABLED') === 'true';

    if (!enabled) {
      return new LocalComprasPublisher();
    }

    const brokers = configService
      .get<string>('KAFKA_BROKERS', '127.0.0.1:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);

    return new KafkaComprasPublisher({
      brokers,
      clientId: configService.get<string>('KAFKA_CLIENT_ID', 'modulo-compras'),
      topicSolicitudes: configService.get<string>(
        'KAFKA_TOPIC_SOLICITUDES',
        'compras.solicitudes',
      ),
    });
  },
};
