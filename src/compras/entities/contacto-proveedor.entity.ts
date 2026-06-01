import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoGeneral } from '../compras.types';
import { ProveedorEntity } from './proveedor.entity';

@Entity('proveedor_contactos')
@Index('idx_proveedor_contactos_proveedor_estado', ['idProveedor', 'estado'])
@Index('idx_proveedor_contactos_principal', ['idProveedor', 'esPrincipal'])
export class ContactoProveedorEntity {
  @PrimaryGeneratedColumn({
    name: 'id_contacto',
    type: 'bigint',
    unsigned: true,
  })
  idContacto: number;

  @Column({ name: 'id_proveedor', type: 'bigint', unsigned: true })
  idProveedor: number;

  @ManyToOne(() => ProveedorEntity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: ProveedorEntity;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string | null;

  @Index('idx_proveedor_contactos_email')
  @Column({ length: 150 })
  email: string;

  @Column({ name: 'telefono_principal', length: 20 })
  telefonoPrincipal: string;

  @Column({
    name: 'telefono_secundario',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefonoSecundario: string | null;

  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;

  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO',
  })
  estado: EstadoGeneral;
}
