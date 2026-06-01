import {
  ConflictException,
  HttpException,
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

type Payload = Record<string, unknown>;
type DireccionPatch = Partial<Omit<Direccion, 'idDireccion' | 'idProveedor'>>;
type ContactoPatch = Partial<
  Omit<ContactoProveedor, 'idContacto' | 'idProveedor'>
>;

@Injectable()
export class ComprasService {
  private proveedores: Proveedor[] = [
    {
      idProveedor: 1,
      descripcion: 'Distribuidora Nandu S.A.',
      ruc: '80123456-7',
      estado: 'ACTIVO',
      fechaRegistro: '2026-04-11T10:00:00.000Z',
    },
  ];

  private direcciones: Direccion[] = [
    {
      idDireccion: 1,
      idProveedor: 1,
      departamento: 'Central',
      ciudad: 'Luque',
      barrio: 'Villa Aurelia',
      callePrincipal: 'Mcal. Estigarribia',
      calleSecundaria: null,
      numero: '1450',
      referencia: 'Frente al mercado',
      latitud: -25.2367,
      longitud: -57.4789,
      estado: 'ACTIVO',
    },
  ];

  private contactos: ContactoProveedor[] = [
    {
      idContacto: 1,
      idProveedor: 1,
      nombre: 'Carlos',
      apellido: 'Vera',
      cargo: 'Gerente Comercial',
      email: 'cvera@nandu.com.py',
      telefonoPrincipal: '+595981123456',
      telefonoSecundario: null,
      esPrincipal: true,
      estado: 'ACTIVO',
    },
  ];

  private solicitudes: SolicitudCompra[] = [];
  private detalles: DetalleSolicitud[] = [];
  private autorizaciones: AutorizacionCompra[] = [];

  private proveedorSeq = 2;
  private direccionSeq = 2;
  private contactoSeq = 2;
  private solicitudSeq = 1;
  private detalleSeq = 1;
  private autorizacionSeq = 1;

  listarProveedores(query: Payload): Paginated<Payload> {
    const vista = this.parseVista(query.vista);
    let rows = [...this.proveedores];

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

  crearProveedor(body: Payload): Payload {
    const descripcion = this.requireText(body.descripcion, 'descripcion', 200);
    const ruc = this.requireRuc(body.ruc);
    const estado = body.estado ?? 'ACTIVO';
    this.assertEstadoGeneral(estado, 'estado');
    this.assertUniqueRuc(ruc);

    const proveedor: Proveedor = {
      idProveedor: this.proveedorSeq++,
      descripcion,
      ruc,
      estado,
      fechaRegistro: new Date().toISOString(),
    };

    this.proveedores.push(proveedor);
    return { data: this.proveedorVista(proveedor, 1) };
  }

  obtenerProveedor(id: number, vista: unknown): Payload {
    return {
      data: this.proveedorVista(this.findProveedor(id), this.parseVista(vista)),
    };
  }

  actualizarProveedor(id: number, body: Payload): Payload {
    this.assertHasBody(body);
    const proveedor = this.findProveedor(id);

    if (body.descripcion !== undefined) {
      proveedor.descripcion = this.requireText(
        body.descripcion,
        'descripcion',
        200,
      );
    }
    if (body.ruc !== undefined) {
      const ruc = this.requireRuc(body.ruc);
      this.assertUniqueRuc(ruc, id);
      proveedor.ruc = ruc;
    }
    if (body.estado !== undefined) {
      this.assertEstadoGeneral(body.estado, 'estado');
      proveedor.estado = body.estado;
    }

    return { data: this.proveedorVista(proveedor, 1) };
  }

  listarDirecciones(proveedorId: number, query: Payload): Payload {
    this.findProveedor(proveedorId);
    let data = this.direcciones.filter((d) => d.idProveedor === proveedorId);
    if (query.estado) data = data.filter((d) => d.estado === query.estado);
    return { data };
  }

  crearDireccion(proveedorId: number, body: Payload): Payload {
    this.findProveedor(proveedorId);
    const direccion = this.buildDireccion(proveedorId, body);
    this.direcciones.push(direccion);
    return { data: direccion };
  }

  obtenerDireccion(proveedorId: number, direccionId: number): Payload {
    return { data: this.findDireccion(proveedorId, direccionId) };
  }

  actualizarDireccion(
    proveedorId: number,
    direccionId: number,
    body: Payload,
  ): Payload {
    this.assertHasBody(body);
    const direccion = this.findDireccion(proveedorId, direccionId);
    const patch = this.normalizeDireccionPatch(body);
    Object.assign(direccion, patch);
    return { data: direccion };
  }

  listarContactos(proveedorId: number, query: Payload): Payload {
    this.findProveedor(proveedorId);
    let data = this.contactos.filter((c) => c.idProveedor === proveedorId);
    if (query.estado) data = data.filter((c) => c.estado === query.estado);
    if (query.esPrincipal !== undefined) {
      const principal = this.parseBoolean(query.esPrincipal, 'esPrincipal');
      data = data.filter((c) => c.esPrincipal === principal);
    }
    return { data };
  }

  crearContacto(proveedorId: number, body: Payload): Payload {
    this.findProveedor(proveedorId);
    const contacto = this.buildContacto(proveedorId, body);
    if (contacto.esPrincipal) this.clearContactoPrincipal(proveedorId);
    this.contactos.push(contacto);
    return { data: contacto };
  }

  obtenerContacto(proveedorId: number, contactoId: number): Payload {
    return { data: this.findContacto(proveedorId, contactoId) };
  }

  actualizarContacto(
    proveedorId: number,
    contactoId: number,
    body: Payload,
  ): Payload {
    this.assertHasBody(body);
    const contacto = this.findContacto(proveedorId, contactoId);
    const patch = this.normalizeContactoPatch(body);
    if (patch.esPrincipal) this.clearContactoPrincipal(proveedorId, contactoId);
    Object.assign(contacto, patch);
    return { data: contacto };
  }

  listarSolicitudes(query: Payload): Paginated<Payload> {
    const vista = this.parseVista(query.vista);
    let rows = [...this.solicitudes];

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

  crearSolicitud(body: Payload): Payload {
    const proveedorId = this.parseId(body.idProveedor, 'idProveedor');
    const proveedor = this.findProveedor(proveedorId);
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

    const idSolicitud = this.solicitudSeq++;
    const items = rawItems.map((item, index) => {
      if (!this.isPayload(item)) {
        throw this.validation(`items.${index}`, 'Debe ser un objeto.');
      }
      return this.buildDetalle(idSolicitud, item);
    });
    const subtotalIva5 = items.reduce((acc, item) => acc + item.iva5, 0);
    const subtotalIva10 = items.reduce((acc, item) => acc + item.iva10, 0);
    const subtotalExenta = items.reduce((acc, item) => acc + item.exenta, 0);

    const solicitud: SolicitudCompra = {
      idSolicitud,
      numeroReferencia: this.generateNumeroReferencia(now, idSolicitud),
      idProveedor: proveedorId,
      descripcion: this.optionalText(body.descripcion, 'descripcion', 200),
      estado: 'PENDIENTE',
      subtotalIva5,
      subtotalIva10,
      subtotalExenta,
      montoTotal: subtotalIva5 + subtotalIva10 + subtotalExenta,
      fechaCreacion: now.toISOString(),
      fechaReqEntrega,
    };

    const autorizacion: AutorizacionCompra = {
      idAutorizacion: this.autorizacionSeq++,
      idSolicitud,
      estado: 'EN_PROCESO',
      kafkaMessageId: this.generateKafkaMessageId(),
      fechaEnvioKafka: new Date().toISOString(),
      fechaRespuestaCaja: null,
      resultadoCaja: null,
      observacion: 'Publicacion aceptada por compras.solicitudes.',
    };

    this.solicitudes.push(solicitud);
    this.detalles.push(...items);
    this.autorizaciones.push(autorizacion);

    return { data: this.solicitudVista(solicitud, 3) };
  }

  obtenerSolicitud(id: number, vista: unknown): Payload {
    return {
      data: this.solicitudVista(this.findSolicitud(id), this.parseVista(vista)),
    };
  }

  obtenerAutorizacionPorSolicitud(id: number, vista: unknown): Payload {
    this.findSolicitud(id);
    return {
      data: this.autorizacionVista(
        this.findAutorizacionBySolicitud(id),
        this.parseVista(vista),
      ),
    };
  }

  reintentarPublicacion(id: number): Payload {
    this.findSolicitud(id);
    const autorizacion = this.findAutorizacionBySolicitud(id);
    if (!['ERROR_KAFKA', 'PENDIENTE_ENVIO'].includes(autorizacion.estado)) {
      throw this.conflict(
        'Solo se puede reintentar desde los estados ERROR_KAFKA o PENDIENTE_ENVIO.',
        'INCOMPATIBLE_STATE',
      );
    }

    autorizacion.estado = 'ENVIANDO';
    autorizacion.kafkaMessageId = this.generateKafkaMessageId();
    autorizacion.fechaEnvioKafka = new Date().toISOString();
    autorizacion.observacion = 'Reintento de publicacion iniciado.';

    return { data: this.autorizacionVista(autorizacion, 2) };
  }

  listarAutorizaciones(query: Payload): Paginated<Payload> {
    const vista = this.parseVista(query.vista);
    let rows = [...this.autorizaciones];

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

  obtenerAutorizacion(id: number, vista: unknown): Payload {
    return {
      data: this.autorizacionVista(
        this.findAutorizacion(id),
        this.parseVista(vista),
      ),
    };
  }

  private proveedorVista(proveedor: Proveedor, vista: Vista): Payload {
    const base: Payload = { ...proveedor };
    if (vista >= 2) {
      base.direcciones = this.direcciones.filter(
        (direccion) => direccion.idProveedor === proveedor.idProveedor,
      );
    }
    if (vista >= 3) {
      base.contactos = this.contactos.filter(
        (contacto) => contacto.idProveedor === proveedor.idProveedor,
      );
    }
    return base;
  }

  private solicitudVista(solicitud: SolicitudCompra, vista: Vista): Payload {
    const base: Payload = { ...solicitud };
    if (vista >= 2) {
      base.items = this.detalles.filter(
        (detalle) => detalle.idSolicitud === solicitud.idSolicitud,
      );
    }
    if (vista >= 3) {
      const autorizacion = this.autorizaciones.find(
        (item) => item.idSolicitud === solicitud.idSolicitud,
      );
      base.autorizacion = autorizacion
        ? this.autorizacionVista(autorizacion, 2)
        : null;
    }
    return base;
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

  private buildDireccion(proveedorId: number, body: Payload): Direccion {
    const patch = this.normalizeDireccionPatch(body, true);
    return {
      idDireccion: this.direccionSeq++,
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

  private buildContacto(proveedorId: number, body: Payload): ContactoProveedor {
    const patch = this.normalizeContactoPatch(body, true);
    return {
      idContacto: this.contactoSeq++,
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

  private buildDetalle(idSolicitud: number, body: Payload): DetalleSolicitud {
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
      idDetalle: this.detalleSeq++,
      idSolicitud,
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
    mapper: (item: T) => R,
  ): Paginated<R> {
    const page = this.optionalPageNumber(query.page, 'page', 1);
    const size = this.optionalPageNumber(query.size, 'size', 20);
    const start = (page - 1) * size;
    return {
      page,
      size,
      total: rows.length,
      data: rows.slice(start, start + size).map(mapper),
    };
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

  private findProveedor(id: number): Proveedor {
    const proveedor = this.proveedores.find((item) => item.idProveedor === id);
    if (!proveedor) throw this.notFound('Proveedor no encontrado.');
    return proveedor;
  }

  private findDireccion(proveedorId: number, direccionId: number): Direccion {
    this.findProveedor(proveedorId);
    const direccion = this.direcciones.find(
      (item) =>
        item.idProveedor === proveedorId && item.idDireccion === direccionId,
    );
    if (!direccion) throw this.notFound('Direccion no encontrada.');
    return direccion;
  }

  private findContacto(
    proveedorId: number,
    contactoId: number,
  ): ContactoProveedor {
    this.findProveedor(proveedorId);
    const contacto = this.contactos.find(
      (item) =>
        item.idProveedor === proveedorId && item.idContacto === contactoId,
    );
    if (!contacto) throw this.notFound('Contacto no encontrado.');
    return contacto;
  }

  private findSolicitud(id: number): SolicitudCompra {
    const solicitud = this.solicitudes.find((item) => item.idSolicitud === id);
    if (!solicitud) throw this.notFound('Solicitud de compra no encontrada.');
    return solicitud;
  }

  private findAutorizacion(id: number): AutorizacionCompra {
    const autorizacion = this.autorizaciones.find(
      (item) => item.idAutorizacion === id,
    );
    if (!autorizacion)
      throw this.notFound('Autorizacion de compra no encontrada.');
    return autorizacion;
  }

  private findAutorizacionBySolicitud(idSolicitud: number): AutorizacionCompra {
    const autorizacion = this.autorizaciones.find(
      (item) => item.idSolicitud === idSolicitud,
    );
    if (!autorizacion)
      throw this.notFound('Autorizacion de compra no encontrada.');
    return autorizacion;
  }

  private clearContactoPrincipal(proveedorId: number, exceptId?: number): void {
    this.contactos
      .filter(
        (contacto) =>
          contacto.idProveedor === proveedorId &&
          contacto.idContacto !== exceptId,
      )
      .forEach((contacto) => {
        contacto.esPrincipal = false;
      });
  }

  private assertUniqueRuc(ruc: string, currentId?: number): void {
    const exists = this.proveedores.some(
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

  private generateKafkaMessageId(): string {
    return `msg-${randomUUID().slice(0, 18)}`;
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
