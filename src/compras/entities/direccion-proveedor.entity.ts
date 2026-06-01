import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoGeneral } from '../compras.types';
import { decimalTransformer } from './decimal.transformer';
import { ProveedorEntity } from './proveedor.entity';

@Entity('proveedor_direcciones')
@Index('idx_proveedor_direcciones_proveedor_estado', ['idProveedor', 'estado'])
export class DireccionProveedorEntity {
  @PrimaryGeneratedColumn({
    name: 'id_direccion',
    type: 'bigint',
    unsigned: true,
  })
  idDireccion: number;

  @Column({ name: 'id_proveedor', type: 'bigint', unsigned: true })
  idProveedor: number;

  @ManyToOne(() => ProveedorEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: ProveedorEntity;

  @Column({ length: 100 })
  departamento: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  barrio: string | null;

  @Column({ name: 'calle_principal', length: 200 })
  callePrincipal: string;

  @Column({
    name: 'calle_secundaria',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  calleSecundaria: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  referencia: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  latitud: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  longitud: number | null;

  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO',
  })
  estado: EstadoGeneral;
}
