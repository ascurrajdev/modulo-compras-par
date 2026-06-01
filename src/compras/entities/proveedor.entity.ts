import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoGeneral } from '../compras.types';

@Entity('proveedores')
export class ProveedorEntity {
  @PrimaryGeneratedColumn({
    name: 'id_proveedor',
    type: 'bigint',
    unsigned: true,
  })
  idProveedor: number;

  @Index('idx_proveedores_descripcion')
  @Column({ length: 200 })
  descripcion: string;

  @Index('uq_proveedores_ruc', { unique: true })
  @Column({ length: 15 })
  ruc: string;

  @Index('idx_proveedores_estado')
  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO',
  })
  estado: EstadoGeneral;

  @Column({
    name: 'fecha_registro',
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  fechaRegistro: Date;
}
