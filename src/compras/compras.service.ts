import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AutorizacionCompra,
  ContactoProveedor,
  DetalleSolicitud,
  Direccion,
  EstadoGeneral,
  PageQuery,
  Paginated,
  Proveedor,
  SolicitudCompra,
  Vista,
} from './compras.types';
import {
  COMPRAS_PUBLISHER,
  ComprasPublisher,
} from './publishers/compras-publisher';
import {
  COMPRAS_REPOSITORY,
  ComprasRepository,
} from './repositories/compras.repository';

type Payload = Record<string, unknown>;
type DireccionPatch = Partial<Omit<Direccion, 'idDireccion' | 'idProveedor'>>;
type ContactoPatch = Partial<
  Omit<ContactoProveedor, 'idContacto' | 'idProveedor'>
>;

@Injectable()
export class ComprasService {
  constructor(
    @Inject(COMPRAS_REPOSITORY)
    private readonly comprasRepository: ComprasRepository,
    @Inject(COMPRAS_PUBLISHER)
    private readonly comprasPublisher: ComprasPublisher,
  ) {}

  async listarProveedores(query: Payload): Promise<Paginated<Payload>> {
    const vista = this.parseVista(query.vista);
    let rows = await this.comprasRepository.listarProveedores();

    if (query.estado) rows = rows.filter((p) => p.estado === query.estado);
    if (query.ruc) rows = rows.filter((p) => p.ruc === query.ruc);
    if (query.descripcion !== undefined) {
      const term = this.text(
        query.descripcion,
        'descripcion',
        200,
      ).toLowerCase();
      rows = rows.filter((p) => p.descripcion.toLowerCase().includes(term));
    }

    return this.paginate(rows, query, (proveedor) =>
      this.proveedorVista(proveedor, vista),
    );
  }

  async crearProveedor(body: Payload): Promise<Payload> {
    const descripcion = this.requireText(body.descripcion, 'descripcion', 200);
    const ruc = this.requireRuc(body.ruc);
    const estado = body.estado ?? 'ACTIVO';
    this.assertEstadoGeneral(estado, 'estado');
    await this.assertUniqueRuc(ruc);

    const proveedor = await this.comprasRepository.crearProveedor({
      descripcion,
      ruc,
      estado,
      fechaRegistro: new Date().toISOString(),
    });

    return { data: await this.proveedorVista(proveedor, 1) };
  }

  async obtenerProveedor(id: number, vista: unknown): Promise<Payload> {
    return {
      data: await this.proveedorVista(
        await this.findProveedor(id),
        this.parseVista(vista),
      ),
    };
  }

  async actualizarProveedor(id: number, body: Payload): Promise<Payload> {
    this.assertHasBody(body);
    const proveedor = await this.findProveedor(id);

    if (body.descripcion !== undefined) {
      proveedor.descripcion = this.requireText(
        body.descripcion,
        'descripcion',
        200,
      );
    }
    if (body.ruc !== undefined) {
      const ruc = this.requireRuc(body.ruc);
      await this.assertUniqueRuc(ruc, id);
      proveedor.ruc = ruc;
    }
    if (body.estado !== undefined) {
      this.assertEstadoGeneral(body.estado, 'estado');
      proveedor.estado = body.estado;
    }

    const updated = await this.comprasRepository.actualizarProveedor(proveedor);
    return { data: await this.proveedorVista(updated, 1) };
  }

  async listarDirecciones(
    proveedorId: number,
    query: Payload,
  ): Promise<Payload> {
    await this.findProveedor(proveedorId);
    let data = (await this.comprasRepository.listarDirecciones()).filter(
      (d) => d.idProveedor === proveedorId,
    );
    if (query.estado) data = data.filter((d) => d.estado === query.estado);
    return { data };
  }

  async crearDireccion(proveedorId: number, body: Payload): Promise<Payload> {
    await this.findProveedor(proveedorId);
    const direccion = await this.comprasRepository.crearDireccion(
      this.buildDireccion(proveedorId, body),
    );
    return { data: direccion };
  }

  async obtenerDireccion(
    proveedorId: number,
    direccionId: number,
  ): Promise<Payload> {
    return { data: await this.findDireccion(proveedorId, direccionId) };
  }

  async actualizarDireccion(
    proveedorId: number,
    direccionId: number,
    body: Payload,
  ): Promise<Payload> {
    this.assertHasBody(body);
    const direccion = await this.findDireccion(proveedorId, direccionId);
    const patch = this.normalizeDireccionPatch(body);
    const updated = await this.comprasRepository.actualizarDireccion({
      ...direccion,
      ...patch,
    });
    return { data: updated };
  }

  async listarContactos(proveedorId: number, query: Payload): Promise<Payload> {
    await this.findProveedor(proveedorId);
    let data = (await this.comprasRepository.listarContactos()).filter(
      (c) => c.idProveedor === proveedorId,
    );
    if (query.estado) data = data.filter((c) => c.estado === query.estado);
    if (query.esPrincipal !== undefined) {
      const principal = this.parseBoolean(query.esPrincipal, 'esPrincipal');
      data = data.filter((c) => c.esPrincipal === principal);
    }
    return { data };
  }

  async crearContacto(proveedorId: number, body: Payload): Promise<Payload> {
    await this.findProveedor(proveedorId);
    const contacto = this.buildContacto(proveedorId, body);
    if (contacto.esPrincipal) await this.clearContactoPrincipal(proveedorId);
    const created = await this.comprasRepository.crearContacto(contacto);
    return { data: created };
  }

  async obtenerContacto(
    proveedorId: number,
    contactoId: number,
  ): Promise<Payload> {
    return { data: await this.findContacto(proveedorId, contactoId) };
  }

  async actualizarContacto(
    proveedorId: number,
    contactoId: number,
    body: Payload,
  ): Promise<Payload> {
    this.assertHasBody(body);
    const contacto = await this.findContacto(proveedorId, contactoId);
    const patch = this.normalizeContactoPatch(body);
    if (patch.esPrincipal) {
      await this.clearContactoPrincipal(proveedorId, contactoId);
    }
    const updated = await this.comprasRepository.actualizarContacto({
      ...contacto,
      ...patch,
    });
    return { data: updated };
  }

  async listarSolicitudes(query: Payload): Promise<Paginated<Payload>> {
    const vista = this.parseVista(query.vista);
    let rows = await this.comprasRepository.listarSolicitudes();

    if (query.estado) rows = rows.filter((s) => s.estado === query.estado);
    if (query.proveedorId) {
      const proveedorId = this.parseId(query.proveedorId, 'proveedorId');
      rows = rows.filter((s) => s.idProveedor === proveedorId);
    }
    if (query.numeroReferencia) {
      rows = rows.filter((s) => s.numeroReferencia === query.numeroReferencia);
    }
    if (query.fechaDesde) {
      const desde = this.parseDate(query.fechaDesde, 'fechaDesde');
      rows = rows.filter((s) => s.fechaCreacion.slice(0, 10) >= desde);
    }
    if (query.fechaHasta) {
      const hasta = this.parseDate(query.fechaHasta, 'fechaHasta');
      rows = rows.filter((s) => s.fechaCreacion.slice(0, 10) <= hasta);
    }

    return this.paginate(rows, query, (solicitud) =>
      this.solicitudVista(solicitud, vista),
    );
  }

  async crearSolicitud(body: Payload): Promise<Payload> {
    const proveedorId = this.parseId(body.idProveedor, 'idProveedor');
    const proveedor = await this.findProveedor(proveedorId);
    if (proveedor.estado !== 'ACTIVO') {
      throw this.conflict(
        'El proveedor debe estar ACTIVO para crear solicitudes.',
      );
    }
    const rawItems: unknown = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw this.validation('items', 'Se requiere al menos un item.');
    }

    const now = new Date();
    const fechaReqEntrega =
      body.fechaReqEntrega === undefined || body.fechaReqEntrega === null
        ? null
        : this.parseDate(body.fechaReqEntrega, 'fechaReqEntrega');
    if (fechaReqEntrega && fechaReqEntrega < now.toISOString().slice(0, 10)) {
      throw this.validation(
        'fechaReqEntrega',
        'Debe ser igual o posterior a la fecha de creacion.',
      );
    }

    const detalles = rawItems.map((item, index) => {
      if (!this.isPayload(item)) {
        throw this.validation(`items.${index}`, 'Debe ser un objeto.');
      }
      return this.buildDetalle(item);
    });
    const subtotalIva5 = detalles.reduce((acc, item) => acc + item.iva5, 0);
    const subtotalIva10 = detalles.reduce((acc, item) => acc + item.iva10, 0);
    const subtotalExenta = detalles.reduce((acc, item) => acc + item.exenta, 0);

    const created = await this.comprasRepository.crearSolicitud({
      solicitud: {
        idProveedor: proveedorId,
        descripcion: this.optionalText(body.descripcion, 'descripcion', 200),
        estado: 'PENDIENTE',
        subtotalIva5,
        subtotalIva10,
        subtotalExenta,
        montoTotal: subtotalIva5 + subtotalIva10 + subtotalExenta,
        fechaCreacion: now.toISOString(),
        fechaReqEntrega,
      },
      detalles,
      autorizacion: {
        estado: 'PENDIENTE_ENVIO',
        kafkaMessageId: null,
        fechaEnvioKafka: null,
        fechaRespuestaCaja: null,
        resultadoCaja: null,
        observacion: 'Solicitud pendiente de publicacion en Kafka.',
      },
      numeroReferenciaFactory: (id) => this.generateNumeroReferencia(now, id),
    });

    await this.publicarSolicitudCreada(created.solicitud, created.autorizacion);

    return { data: await this.solicitudVista(created.solicitud, 3) };
  }

  async obtenerSolicitud(id: number, vista: unknown): Promise<Payload> {
    return {
      data: await this.solicitudVista(
        await this.findSolicitud(id),
        this.parseVista(vista),
      ),
    };
  }

  async obtenerAutorizacionPorSolicitud(
    id: number,
    vista: unknown,
  ): Promise<Payload> {
    await this.findSolicitud(id);
    return {
      data: this.autorizacionVista(
        await this.findAutorizacionBySolicitud(id),
        this.parseVista(vista),
      ),
    };
  }

  async reintentarPublicacion(id: number): Promise<Payload> {
    const solicitud = await this.findSolicitud(id);
    const autorizacion = await this.findAutorizacionBySolicitud(id);
    if (!['ERROR_KAFKA', 'PENDIENTE_ENVIO'].includes(autorizacion.estado)) {
      throw this.conflict(
        'Solo se puede reintentar desde los estados ERROR_KAFKA o PENDIENTE_ENVIO.',
        'INCOMPATIBLE_STATE',
      );
    }

    const updated = await this.publicarSolicitudCreada(solicitud, {
      ...autorizacion,
      estado: 'ENVIANDO',
      observacion: 'Reintento de publicacion iniciado.',
    });
    return { data: this.autorizacionVista(updated, 2) };
  }

  async listarAutorizaciones(query: Payload): Promise<Paginated<Payload>> {
    const vista = this.parseVista(query.vista);
    let rows = await this.comprasRepository.listarAutorizaciones();

    if (query.estado) rows = rows.filter((a) => a.estado === query.estado);
    if (query.resultadoCaja) {
      rows = rows.filter((a) => a.resultadoCaja === query.resultadoCaja);
    }
    if (query.kafkaMessageId) {
      rows = rows.filter((a) => a.kafkaMessageId === query.kafkaMessageId);
    }

    return this.paginate(rows, query, (autorizacion) =>
      this.autorizacionVista(autorizacion, vista),
    );
  }

  async obtenerAutorizacion(id: number, vista: unknown): Promise<Payload> {
    return {
      data: this.autorizacionVista(
        await this.findAutorizacion(id),
        this.parseVista(vista),
      ),
    };
  }

  private async proveedorVista(
    proveedor: Proveedor,
    vista: Vista,
  ): Promise<Payload> {
    const base: Payload = { ...proveedor };
    if (vista >= 2) {
      const direcciones = await this.comprasRepository.listarDirecciones();
      base.direcciones = direcciones.filter(
        (direccion) => direccion.idProveedor === proveedor.idProveedor,
      );
    }
    if (vista >= 3) {
      const contactos = await this.comprasRepository.listarContactos();
      base.contactos = contactos.filter(
        (contacto) => contacto.idProveedor === proveedor.idProveedor,
      );
    }
    return base;
  }

  private async solicitudVista(
    solicitud: SolicitudCompra,
    vista: Vista,
  ): Promise<Payload> {
    const base: Payload = { ...solicitud };
    if (vista >= 2) {
      const detalles = await this.comprasRepository.listarDetalles();
      base.items = detalles.filter(
        (detalle) => detalle.idSolicitud === solicitud.idSolicitud,
      );
    }
    if (vista >= 3) {
      const autorizaciones =
        await this.comprasRepository.listarAutorizaciones();
      const autorizacion = autorizaciones.find(
        (item) => item.idSolicitud === solicitud.idSolicitud,
      );
      base.autorizacion = autorizacion
        ? this.autorizacionVista(autorizacion, 2)
        : null;
    }
    return base;
  }

  private async publicarSolicitudCreada(
    solicitud: SolicitudCompra,
    autorizacion: AutorizacionCompra,
  ): Promise<AutorizacionCompra> {
    const proveedor = await this.findProveedor(solicitud.idProveedor);
    const detalles = (await this.comprasRepository.listarDetalles()).filter(
      (detalle) => detalle.idSolicitud === solicitud.idSolicitud,
    );
    const occurredAt = new Date().toISOString();

    try {
      const result = await this.comprasPublisher.publishSolicitudCreada({
        eventId: randomUUID(),
        eventType: 'compras.solicitud-creada',
        occurredAt,
        solicitud,
        proveedor,
        detalles,
      });

      return this.comprasRepository.actualizarAutorizacion({
        ...autorizacion,
        estado: 'EN_PROCESO',
        kafkaMessageId: result.messageId,
        fechaEnvioKafka: occurredAt,
        observacion: 'Publicacion aceptada por compras.solicitudes.',
      });
    } catch (error) {
      return this.comprasRepository.actualizarAutorizacion({
        ...autorizacion,
        estado: 'ERROR_KAFKA',
        fechaEnvioKafka: occurredAt,
        observacion: `Error al publicar en Kafka: ${this.errorMessage(error)}`,
      });
    }
  }

  private autorizacionVista(
    autorizacion: AutorizacionCompra,
    vista: Vista,
  ): Payload {
    const base: Payload = {
      idAutorizacion: autorizacion.idAutorizacion,
      idSolicitud: autorizacion.idSolicitud,
      estado: autorizacion.estado,
    };
    if (vista >= 2) {
      base.kafkaMessageId = autorizacion.kafkaMessageId;
      base.fechaEnvioKafka = autorizacion.fechaEnvioKafka;
      base.fechaRespuestaCaja = autorizacion.fechaRespuestaCaja;
      base.resultadoCaja = autorizacion.resultadoCaja;
    }
    if (vista >= 3) {
      base.observacion = autorizacion.observacion;
    }
    return base;
  }

  private buildDireccion(
    proveedorId: number,
    body: Payload,
  ): Omit<Direccion, 'idDireccion'> {
    const patch = this.normalizeDireccionPatch(body, true);
    return {
      idProveedor: proveedorId,
      departamento: patch.departamento!,
      ciudad: patch.ciudad!,
      barrio: patch.barrio ?? null,
      callePrincipal: patch.callePrincipal!,
      calleSecundaria: patch.calleSecundaria ?? null,
      numero: patch.numero ?? null,
      referencia: patch.referencia ?? null,
      latitud: patch.latitud ?? null,
      longitud: patch.longitud ?? null,
      estado: patch.estado ?? 'ACTIVO',
    };
  }

  private normalizeDireccionPatch(
    body: Payload,
    creating = false,
  ): DireccionPatch {
    const patch: DireccionPatch = {};
    const required = creating
      ? ['departamento', 'ciudad', 'callePrincipal']
      : [];

    for (const field of required) this.requireText(body[field], field, 200);

    if (body.departamento !== undefined) {
      patch.departamento = this.requireText(
        body.departamento,
        'departamento',
        100,
      );
    }
    if (body.ciudad !== undefined) {
      patch.ciudad = this.requireText(body.ciudad, 'ciudad', 100);
    }
    if (body.barrio !== undefined) {
      patch.barrio = this.nullableText(body.barrio, 'barrio', 150);
    }
    if (body.callePrincipal !== undefined) {
      patch.callePrincipal = this.requireText(
        body.callePrincipal,
        'callePrincipal',
        200,
      );
    }
    if (body.calleSecundaria !== undefined) {
      patch.calleSecundaria = this.nullableText(
        body.calleSecundaria,
        'calleSecundaria',
        200,
      );
    }
    if (body.numero !== undefined) {
      patch.numero = this.nullableText(body.numero, 'numero', 20);
    }
    if (body.referencia !== undefined) {
      patch.referencia = this.nullableText(body.referencia, 'referencia', 300);
    }
    if (body.latitud !== undefined)
      patch.latitud = this.coordinate(body.latitud, 'latitud', -90, 90);
    if (body.longitud !== undefined) {
      patch.longitud = this.coordinate(body.longitud, 'longitud', -180, 180);
    }
    if (body.estado !== undefined) {
      this.assertEstadoGeneral(body.estado, 'estado');
      patch.estado = body.estado;
    }
    return patch;
  }

  private buildContacto(
    proveedorId: number,
    body: Payload,
  ): Omit<ContactoProveedor, 'idContacto'> {
    const patch = this.normalizeContactoPatch(body, true);
    return {
      idProveedor: proveedorId,
      nombre: patch.nombre!,
      apellido: patch.apellido!,
      cargo: patch.cargo ?? null,
      email: patch.email!,
      telefonoPrincipal: patch.telefonoPrincipal!,
      telefonoSecundario: patch.telefonoSecundario ?? null,
      esPrincipal: patch.esPrincipal ?? false,
      estado: patch.estado ?? 'ACTIVO',
    };
  }

  private normalizeContactoPatch(
    body: Payload,
    creating = false,
  ): ContactoPatch {
    const patch: ContactoPatch = {};
    const required = creating
      ? ['nombre', 'apellido', 'email', 'telefonoPrincipal']
      : [];

    for (const field of required) this.requireText(body[field], field, 150);

    if (body.nombre !== undefined) {
      patch.nombre = this.requireText(body.nombre, 'nombre', 100);
    }
    if (body.apellido !== undefined) {
      patch.apellido = this.requireText(body.apellido, 'apellido', 100);
    }
    if (body.cargo !== undefined) {
      patch.cargo = this.nullableText(body.cargo, 'cargo', 100);
    }
    if (body.email !== undefined) {
      patch.email = this.requireText(body.email, 'email', 150);
    }
    if (body.telefonoPrincipal !== undefined) {
      patch.telefonoPrincipal = this.requireText(
        body.telefonoPrincipal,
        'telefonoPrincipal',
        20,
      );
    }
    if (body.telefonoSecundario !== undefined) {
      patch.telefonoSecundario = this.nullableText(
        body.telefonoSecundario,
        'telefonoSecundario',
        20,
      );
    }
    if (patch.email !== undefined && patch.email !== null) {
      this.assertEmail(patch.email);
    }
    if (body.esPrincipal !== undefined) {
      patch.esPrincipal = this.parseBoolean(body.esPrincipal, 'esPrincipal');
    }
    if (body.estado !== undefined) {
      this.assertEstadoGeneral(body.estado, 'estado');
      patch.estado = body.estado;
    }
    return patch;
  }

  private buildDetalle(
    body: Payload,
  ): Omit<DetalleSolicitud, 'idDetalle' | 'idSolicitud'> {
    const productoId = this.requireText(body.productoId, 'productoId', 50);
    const productoNombre = this.requireText(
      body.productoNombre,
      'productoNombre',
      200,
    );
    const cantidad = this.positiveInteger(body.cantidad, 'cantidad');
    const precioUnitario = this.positiveNumber(
      body.precioUnitario,
      'precioUnitario',
    );
    const iva5 = this.nonNegativeInteger(body.iva5 ?? 0, 'iva5');
    const iva10 = this.nonNegativeInteger(body.iva10 ?? 0, 'iva10');
    const exenta = this.nonNegativeInteger(body.exenta ?? 0, 'exenta');

    return {
      productoId,
      productoNombre,
      cantidad,
      precioUnitario,
      iva5,
      iva10,
      exenta,
      subtotal: iva5 + iva10 + exenta,
    };
  }

  private paginate<T, R>(
    rows: T[],
    query: PageQuery,
    mapper: (item: T) => R | Promise<R>,
  ): Promise<Paginated<R>> {
    const page = this.optionalPageNumber(query.page, 'page', 1);
    const size = this.optionalPageNumber(query.size, 'size', 20);
    const start = (page - 1) * size;
    return Promise.all(rows.slice(start, start + size).map(mapper)).then(
      (data) => ({
        page,
        size,
        total: rows.length,
        data,
      }),
    );
  }

  private parseVista(value: unknown): Vista {
    if (value === undefined || value === null || value === '') return 1;
    const vista = Number(value);
    if (![1, 2, 3].includes(vista)) {
      throw this.validation('vista', 'Debe ser 1, 2 o 3.');
    }
    return vista as Vista;
  }

  private parseId(value: unknown, field: string): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
      throw this.validation(field, 'Debe ser un entero positivo.');
    }
    return id;
  }

  private optionalPageNumber(
    value: unknown,
    field: string,
    fallback: number,
  ): number {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw this.validation(field, 'Debe ser un entero positivo.');
    }
    return parsed;
  }

  private async findProveedor(id: number): Promise<Proveedor> {
    const proveedor = (await this.comprasRepository.listarProveedores()).find(
      (item) => item.idProveedor === id,
    );
    if (!proveedor) throw this.notFound('Proveedor no encontrado.');
    return proveedor;
  }

  private async findDireccion(
    proveedorId: number,
    direccionId: number,
  ): Promise<Direccion> {
    await this.findProveedor(proveedorId);
    const direccion = (await this.comprasRepository.listarDirecciones()).find(
      (item) =>
        item.idProveedor === proveedorId && item.idDireccion === direccionId,
    );
    if (!direccion) throw this.notFound('Direccion no encontrada.');
    return direccion;
  }

  private async findContacto(
    proveedorId: number,
    contactoId: number,
  ): Promise<ContactoProveedor> {
    await this.findProveedor(proveedorId);
    const contacto = (await this.comprasRepository.listarContactos()).find(
      (item) =>
        item.idProveedor === proveedorId && item.idContacto === contactoId,
    );
    if (!contacto) throw this.notFound('Contacto no encontrado.');
    return contacto;
  }

  private async findSolicitud(id: number): Promise<SolicitudCompra> {
    const solicitud = (await this.comprasRepository.listarSolicitudes()).find(
      (item) => item.idSolicitud === id,
    );
    if (!solicitud) throw this.notFound('Solicitud de compra no encontrada.');
    return solicitud;
  }

  private async findAutorizacion(id: number): Promise<AutorizacionCompra> {
    const autorizacion = (
      await this.comprasRepository.listarAutorizaciones()
    ).find((item) => item.idAutorizacion === id);
    if (!autorizacion)
      throw this.notFound('Autorizacion de compra no encontrada.');
    return autorizacion;
  }

  private async findAutorizacionBySolicitud(
    idSolicitud: number,
  ): Promise<AutorizacionCompra> {
    const autorizacion = (
      await this.comprasRepository.listarAutorizaciones()
    ).find((item) => item.idSolicitud === idSolicitud);
    if (!autorizacion)
      throw this.notFound('Autorizacion de compra no encontrada.');
    return autorizacion;
  }

  private async clearContactoPrincipal(
    proveedorId: number,
    exceptId?: number,
  ): Promise<void> {
    const contactos = (await this.comprasRepository.listarContactos())
      .filter(
        (contacto) =>
          contacto.idProveedor === proveedorId &&
          contacto.idContacto !== exceptId &&
          contacto.esPrincipal,
      )
      .map((contacto) => ({ ...contacto, esPrincipal: false }));

    await this.comprasRepository.actualizarContactos(contactos);
  }

  private async assertUniqueRuc(
    ruc: string,
    currentId?: number,
  ): Promise<void> {
    const exists = (await this.comprasRepository.listarProveedores()).some(
      (proveedor) =>
        proveedor.ruc === ruc && proveedor.idProveedor !== currentId,
    );
    if (exists) throw this.conflict('Ya existe un proveedor con ese RUC.');
  }

  private assertHasBody(body: Payload): void {
    if (!body || Object.keys(body).length === 0) {
      throw this.validation('body', 'Debe enviar al menos un campo.');
    }
  }

  private isPayload(value: unknown): value is Payload {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private requireRuc(value: unknown): string {
    const ruc = this.requireText(value, 'ruc', 15);
    if (!/^[0-9]{6,8}-[0-9Kk]$/.test(ruc)) {
      throw this.validation('ruc', 'Debe tener formato XXXXXXXX-X.');
    }
    return ruc;
  }

  private assertEstadoGeneral(
    value: unknown,
    field: string,
  ): asserts value is EstadoGeneral {
    if (!['ACTIVO', 'INACTIVO'].includes(String(value))) {
      throw this.validation(field, 'Debe ser ACTIVO o INACTIVO.');
    }
  }

  private assertEmail(value: string): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw this.validation('email', 'Debe ser un correo valido.');
    }
  }

  private requireText(value: unknown, field: string, max: number): string {
    const parsed = this.text(value, field, max);
    if (parsed.length === 0) throw this.validation(field, 'Es requerido.');
    return parsed;
  }

  private text(value: unknown, field: string, max: number): string {
    if (typeof value !== 'string') {
      throw this.validation(field, 'Debe ser texto.');
    }
    const parsed = value.trim();
    if (parsed.length > max) {
      throw this.validation(field, `No debe superar ${max} caracteres.`);
    }
    return parsed;
  }

  private optionalText(
    value: unknown,
    field: string,
    max: number,
  ): string | null {
    if (value === undefined || value === null) return null;
    return this.text(value, field, max);
  }

  private nullableText(
    value: unknown,
    field: string,
    max: number,
  ): string | null {
    if (value === null) return null;
    return this.requireText(value, field, max);
  }

  private positiveInteger(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw this.validation(field, 'Debe ser un entero mayor a cero.');
    }
    return parsed;
  }

  private nonNegativeInteger(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw this.validation(field, 'Debe ser un entero mayor o igual a cero.');
    }
    return parsed;
  }

  private positiveNumber(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw this.validation(field, 'Debe ser mayor a cero.');
    }
    return parsed;
  }

  private coordinate(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number | null {
    if (value === null) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      throw this.validation(field, `Debe estar entre ${min} y ${max}.`);
    }
    return parsed;
  }

  private parseBoolean(value: unknown, field: string): boolean {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    throw this.validation(field, 'Debe ser booleano.');
  }

  private parseDate(value: unknown, field: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw this.validation(field, 'Debe tener formato YYYY-MM-DD.');
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw this.validation(field, 'Debe ser una fecha valida.');
    }
    return value;
  }

  private generateNumeroReferencia(date: Date, id: number): string {
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = id.toString(36).toUpperCase().padStart(5, '0').slice(-5);
    return `SC-${stamp}-${suffix}`;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.slice(0, 450);
    }

    return 'Error desconocido';
  }

  private validation(field: string, issue: string): HttpException {
    return new UnprocessableEntityException({
      code: 'VALIDATION_ERROR',
      message: 'La solicitud contiene errores de validacion.',
      details: [{ field, issue }],
    });
  }

  private notFound(message: string): HttpException {
    return new NotFoundException({ code: 'NOT_FOUND', message });
  }

  private conflict(
    message: string,
    code = 'BUSINESS_RULE_VIOLATION',
  ): HttpException {
    return new ConflictException({ code, message });
  }
}
