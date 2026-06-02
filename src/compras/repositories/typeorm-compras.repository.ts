import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  AutorizacionCompra,
  ContactoProveedor,
  DetalleSolicitud,
  Direccion,
  Proveedor,
  SolicitudCompra,
} from '../compras.types';
import { AutorizacionCompraEntity } from '../entities/autorizacion-compra.entity';
import { ContactoProveedorEntity } from '../entities/contacto-proveedor.entity';
import { DetalleSolicitudCompraEntity } from '../entities/detalle-solicitud-compra.entity';
import { DireccionProveedorEntity } from '../entities/direccion-proveedor.entity';
import { ProveedorEntity } from '../entities/proveedor.entity';
import { SolicitudCompraEntity } from '../entities/solicitud-compra.entity';
import {
  ComprasRepository,
  CrearSolicitudData,
  SolicitudCreada,
} from './compras.repository';

@Injectable()
export class TypeOrmComprasRepository implements ComprasRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProveedorEntity)
    private readonly proveedores: Repository<ProveedorEntity>,
    @InjectRepository(DireccionProveedorEntity)
    private readonly direcciones: Repository<DireccionProveedorEntity>,
    @InjectRepository(ContactoProveedorEntity)
    private readonly contactos: Repository<ContactoProveedorEntity>,
    @InjectRepository(SolicitudCompraEntity)
    private readonly solicitudes: Repository<SolicitudCompraEntity>,
    @InjectRepository(DetalleSolicitudCompraEntity)
    private readonly detalles: Repository<DetalleSolicitudCompraEntity>,
    @InjectRepository(AutorizacionCompraEntity)
    private readonly autorizaciones: Repository<AutorizacionCompraEntity>,
  ) {}

  async listarProveedores(): Promise<Proveedor[]> {
    const rows = await this.proveedores.find({ order: { idProveedor: 'ASC' } });
    return rows.map((row) => this.toProveedor(row));
  }

  async crearProveedor(
    data: Omit<Proveedor, 'idProveedor'>,
  ): Promise<Proveedor> {
    const entity = await this.proveedores.save(
      this.proveedores.create({
        ...data,
        fechaRegistro: new Date(data.fechaRegistro),
      }),
    );

    return this.toProveedor(entity);
  }

  async actualizarProveedor(proveedor: Proveedor): Promise<Proveedor> {
    const entity = await this.proveedores.save({
      ...proveedor,
      fechaRegistro: new Date(proveedor.fechaRegistro),
    });

    return this.toProveedor(entity);
  }

  async listarDirecciones(): Promise<Direccion[]> {
    const rows = await this.direcciones.find({ order: { idDireccion: 'ASC' } });
    return rows.map((row) => this.toDireccion(row));
  }

  async crearDireccion(
    data: Omit<Direccion, 'idDireccion'>,
  ): Promise<Direccion> {
    const entity = await this.direcciones.save(this.direcciones.create(data));

    return this.toDireccion(entity);
  }

  async actualizarDireccion(direccion: Direccion): Promise<Direccion> {
    const entity = await this.direcciones.save(direccion);

    return this.toDireccion(entity);
  }

  async listarContactos(): Promise<ContactoProveedor[]> {
    const rows = await this.contactos.find({ order: { idContacto: 'ASC' } });
    return rows.map((row) => this.toContacto(row));
  }

  async crearContacto(
    data: Omit<ContactoProveedor, 'idContacto'>,
  ): Promise<ContactoProveedor> {
    const entity = await this.contactos.save(this.contactos.create(data));

    return this.toContacto(entity);
  }

  async actualizarContacto(
    contacto: ContactoProveedor,
  ): Promise<ContactoProveedor> {
    const entity = await this.contactos.save(contacto);

    return this.toContacto(entity);
  }

  async actualizarContactos(contactos: ContactoProveedor[]): Promise<void> {
    await this.contactos.save(contactos);
  }

  async listarSolicitudes(): Promise<SolicitudCompra[]> {
    const rows = await this.solicitudes.find({ order: { idSolicitud: 'ASC' } });
    return rows.map((row) => this.toSolicitud(row));
  }

  async listarDetalles(): Promise<DetalleSolicitud[]> {
    const rows = await this.detalles.find({ order: { idDetalle: 'ASC' } });
    return rows.map((row) => this.toDetalle(row));
  }

  async listarAutorizaciones(): Promise<AutorizacionCompra[]> {
    const rows = await this.autorizaciones.find({
      order: { idAutorizacion: 'ASC' },
    });
    return rows.map((row) => this.toAutorizacion(row));
  }

  async crearSolicitud(data: CrearSolicitudData): Promise<SolicitudCreada> {
    return this.dataSource.transaction(async (manager) => {
      const solicitudRepository = manager.getRepository(SolicitudCompraEntity);
      const detalleRepository = manager.getRepository(
        DetalleSolicitudCompraEntity,
      );
      const autorizacionRepository = manager.getRepository(
        AutorizacionCompraEntity,
      );

      let solicitud = await solicitudRepository.save(
        solicitudRepository.create({
          ...data.solicitud,
          fechaCreacion: new Date(data.solicitud.fechaCreacion),
          numeroReferencia: `TMP-${randomUUID().slice(0, 18)}`,
        }),
      );

      solicitud.numeroReferencia = data.numeroReferenciaFactory(
        solicitud.idSolicitud,
      );
      solicitud = await solicitudRepository.save(solicitud);

      const detalles = await detalleRepository.save(
        data.detalles.map((detalle) =>
          detalleRepository.create({
            ...detalle,
            idSolicitud: solicitud.idSolicitud,
          }),
        ),
      );

      const autorizacion = await autorizacionRepository.save(
        autorizacionRepository.create({
          ...data.autorizacion,
          idSolicitud: solicitud.idSolicitud,
          fechaEnvioKafka: data.autorizacion.fechaEnvioKafka
            ? new Date(data.autorizacion.fechaEnvioKafka)
            : null,
          fechaRespuestaCaja: data.autorizacion.fechaRespuestaCaja
            ? new Date(data.autorizacion.fechaRespuestaCaja)
            : null,
        }),
      );

      return {
        solicitud: this.toSolicitud(solicitud),
        detalles: detalles.map((detalle) => this.toDetalle(detalle)),
        autorizacion: this.toAutorizacion(autorizacion),
      };
    });
  }

  async actualizarAutorizacion(
    autorizacion: AutorizacionCompra,
  ): Promise<AutorizacionCompra> {
    await this.autorizaciones.update(autorizacion.idAutorizacion, {
      idSolicitud: autorizacion.idSolicitud,
      estado: autorizacion.estado,
      kafkaMessageId: autorizacion.kafkaMessageId,
      fechaEnvioKafka: autorizacion.fechaEnvioKafka
        ? new Date(autorizacion.fechaEnvioKafka)
        : null,
      fechaRespuestaCaja: autorizacion.fechaRespuestaCaja
        ? new Date(autorizacion.fechaRespuestaCaja)
        : null,
      resultadoCaja: autorizacion.resultadoCaja,
      observacion: autorizacion.observacion,
    });

    const entity = await this.autorizaciones.findOneByOrFail({
      idAutorizacion: autorizacion.idAutorizacion,
    });

    return this.toAutorizacion(entity);
  }

  private toProveedor(entity: ProveedorEntity): Proveedor {
    return {
      idProveedor: Number(entity.idProveedor),
      descripcion: entity.descripcion,
      ruc: entity.ruc,
      estado: entity.estado,
      fechaRegistro: entity.fechaRegistro.toISOString(),
    };
  }

  private toDireccion(entity: DireccionProveedorEntity): Direccion {
    return {
      idDireccion: Number(entity.idDireccion),
      idProveedor: Number(entity.idProveedor),
      departamento: entity.departamento,
      ciudad: entity.ciudad,
      barrio: entity.barrio,
      callePrincipal: entity.callePrincipal,
      calleSecundaria: entity.calleSecundaria,
      numero: entity.numero,
      referencia: entity.referencia,
      latitud: entity.latitud,
      longitud: entity.longitud,
      estado: entity.estado,
    };
  }

  private toContacto(entity: ContactoProveedorEntity): ContactoProveedor {
    return {
      idContacto: Number(entity.idContacto),
      idProveedor: Number(entity.idProveedor),
      nombre: entity.nombre,
      apellido: entity.apellido,
      cargo: entity.cargo,
      email: entity.email,
      telefonoPrincipal: entity.telefonoPrincipal,
      telefonoSecundario: entity.telefonoSecundario,
      esPrincipal: entity.esPrincipal,
      estado: entity.estado,
    };
  }

  private toSolicitud(entity: SolicitudCompraEntity): SolicitudCompra {
    return {
      idSolicitud: Number(entity.idSolicitud),
      numeroReferencia: entity.numeroReferencia,
      idProveedor: Number(entity.idProveedor),
      descripcion: entity.descripcion,
      estado: entity.estado,
      subtotalIva5: entity.subtotalIva5,
      subtotalIva10: entity.subtotalIva10,
      subtotalExenta: entity.subtotalExenta,
      montoTotal: entity.montoTotal,
      fechaCreacion: entity.fechaCreacion.toISOString(),
      fechaReqEntrega: entity.fechaReqEntrega,
    };
  }

  private toDetalle(entity: DetalleSolicitudCompraEntity): DetalleSolicitud {
    return {
      idDetalle: Number(entity.idDetalle),
      idSolicitud: Number(entity.idSolicitud),
      productoId: entity.productoId,
      productoNombre: entity.productoNombre,
      cantidad: entity.cantidad,
      precioUnitario: entity.precioUnitario,
      iva5: entity.iva5,
      iva10: entity.iva10,
      exenta: entity.exenta,
      subtotal: entity.subtotal,
    };
  }

  private toAutorizacion(entity: AutorizacionCompraEntity): AutorizacionCompra {
    return {
      idAutorizacion: Number(entity.idAutorizacion),
      idSolicitud: Number(entity.idSolicitud),
      estado: entity.estado,
      kafkaMessageId: entity.kafkaMessageId,
      fechaEnvioKafka: entity.fechaEnvioKafka?.toISOString() ?? null,
      fechaRespuestaCaja: entity.fechaRespuestaCaja?.toISOString() ?? null,
      resultadoCaja: entity.resultadoCaja,
      observacion: entity.observacion,
    };
  }
}
