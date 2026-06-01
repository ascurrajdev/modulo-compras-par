import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoSolicitudCompra } from '../compras.types';
import { decimalTransformer } from './decimal.transformer';
import { ProveedorEntity } from './proveedor.entity';

@Entity('solicitudes_compra')
@Index('idx_solicitudes_compra_estado_fecha', ['estado', 'fechaCreacion'])
export class SolicitudCompraEntity {
  @PrimaryGeneratedColumn({
    name: 'id_solicitud',
    type: 'bigint',
    unsigned: true,
  })
  idSolicitud: number;

  @Index('uq_solicitudes_compra_numero_referencia', { unique: true })
  @Column({ name: 'numero_referencia', length: 30 })
  numeroReferencia: string;

  @Index('idx_solicitudes_compra_proveedor')
  @Column({ name: 'id_proveedor', type: 'bigint', unsigned: true })
  idProveedor: number;

  @ManyToOne(() => ProveedorEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: ProveedorEntity;

  @Column({ type: 'varchar', length: 200, nullable: true })
  descripcion: string | null;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
    default: 'PENDIENTE',
  })
  estado: EstadoSolicitudCompra;

  @Column({
    name: 'subtotal_iva5',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotalIva5: number;

  @Column({
    name: 'subtotal_iva10',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotalIva10: number;

  @Column({
    name: 'subtotal_exenta',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotalExenta: number;

  @Column({
    name: 'monto_total',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  montoTotal: number;

  @Column({
    name: 'fecha_creacion',
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  fechaCreacion: Date;

  @Column({ name: 'fecha_req_entrega', type: 'date', nullable: true })
  fechaReqEntrega: string | null;
}
