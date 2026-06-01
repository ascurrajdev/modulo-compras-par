import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoAutorizacionCompra, ResultadoCaja } from '../compras.types';
import { SolicitudCompraEntity } from './solicitud-compra.entity';

@Entity('autorizaciones_compra')
export class AutorizacionCompraEntity {
  @PrimaryGeneratedColumn({
    name: 'id_autorizacion',
    type: 'bigint',
    unsigned: true,
  })
  idAutorizacion: number;

  @Index('uq_autorizaciones_compra_solicitud', { unique: true })
  @Column({ name: 'id_solicitud', type: 'bigint', unsigned: true })
  idSolicitud: number;

  @OneToOne(() => SolicitudCompraEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudCompraEntity;

  @Index('idx_autorizaciones_compra_estado')
  @Column({
    type: 'enum',
    enum: [
      'PENDIENTE_ENVIO',
      'ENVIANDO',
      'EN_PROCESO',
      'APROBADA',
      'RECHAZADA',
      'ERROR_KAFKA',
    ],
    default: 'PENDIENTE_ENVIO',
  })
  estado: EstadoAutorizacionCompra;

  @Index('idx_autorizaciones_compra_kafka_message_id')
  @Column({
    name: 'kafka_message_id',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  kafkaMessageId: string | null;

  @Column({
    name: 'fecha_envio_kafka',
    type: 'timestamp',
    precision: 3,
    nullable: true,
  })
  fechaEnvioKafka: Date | null;

  @Column({
    name: 'fecha_respuesta_caja',
    type: 'timestamp',
    precision: 3,
    nullable: true,
  })
  fechaRespuestaCaja: Date | null;

  @Index('idx_autorizaciones_compra_resultado_caja')
  @Column({
    name: 'resultado_caja',
    type: 'enum',
    enum: ['APROBADA', 'RECHAZADA'],
    nullable: true,
  })
  resultadoCaja: ResultadoCaja | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacion: string | null;
}
