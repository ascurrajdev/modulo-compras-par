import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { AutorizacionCompraEntity } from '../compras/entities/autorizacion-compra.entity';
import { DetalleSolicitudCompraEntity } from '../compras/entities/detalle-solicitud-compra.entity';
import { DireccionProveedorEntity } from '../compras/entities/direccion-proveedor.entity';
import { ContactoProveedorEntity } from '../compras/entities/contacto-proveedor.entity';
import { ProveedorEntity } from '../compras/entities/proveedor.entity';
import { SolicitudCompraEntity } from '../compras/entities/solicitud-compra.entity';

config();

export const comprasEntities = [
  AutorizacionCompraEntity,
  ContactoProveedorEntity,
  DetalleSolicitudCompraEntity,
  DireccionProveedorEntity,
  ProveedorEntity,
  SolicitudCompraEntity,
];

export function getDataSourceOptions(): DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'modulo_compras',
    entities: comprasEntities,
    migrations: ['dist/database/migrations/*.js'],
    synchronize: false,
    migrationsRun: false,
  };
}

export function getTypeOrmOptions(): TypeOrmModuleOptions {
  return getDataSourceOptions();
}
