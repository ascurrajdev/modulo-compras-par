import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from './decimal.transformer';
import { SolicitudCompraEntity } from './solicitud-compra.entity';

@Entity('solicitudes_compra_detalles')
export class DetalleSolicitudCompraEntity {
  @PrimaryGeneratedColumn({
    name: 'id_detalle',
    type: 'bigint',
    unsigned: true,
  })
  idDetalle: number;

  @Index('idx_solicitudes_compra_detalles_solicitud')
  @Column({ name: 'id_solicitud', type: 'bigint', unsigned: true })
  idSolicitud: number;

  @ManyToOne(() => SolicitudCompraEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudCompraEntity;

  @Index('idx_solicitudes_compra_detalles_producto')
  @Column({ name: 'producto_id', length: 50 })
  productoId: string;

  @Column({ name: 'producto_nombre', length: 200 })
  productoNombre: string;

  @Column({ type: 'int', unsigned: true })
  cantidad: number;

  @Column({
    name: 'precio_unitario',
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: decimalTransformer,
  })
  precioUnitario: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  iva5: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  iva10: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  exenta: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotal: number;
}
