import {
  AutorizacionCompra,
  ContactoProveedor,
  DetalleSolicitud,
  Direccion,
  Proveedor,
  SolicitudCompra,
} from '../compras.types';
import {
  ComprasRepository,
  CrearSolicitudData,
  SolicitudCreada,
} from './compras.repository';

export class InMemoryComprasRepository implements ComprasRepository {
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

  listarProveedores(): Promise<Proveedor[]> {
    return Promise.resolve(structuredClone(this.proveedores));
  }

  crearProveedor(data: Omit<Proveedor, 'idProveedor'>): Promise<Proveedor> {
    const proveedor = { ...data, idProveedor: this.proveedorSeq++ };
    this.proveedores.push(proveedor);
    return Promise.resolve(structuredClone(proveedor));
  }

  actualizarProveedor(proveedor: Proveedor): Promise<Proveedor> {
    this.proveedores = this.proveedores.map((item) =>
      item.idProveedor === proveedor.idProveedor
        ? structuredClone(proveedor)
        : item,
    );
    return Promise.resolve(structuredClone(proveedor));
  }

  listarDirecciones(): Promise<Direccion[]> {
    return Promise.resolve(structuredClone(this.direcciones));
  }

  crearDireccion(data: Omit<Direccion, 'idDireccion'>): Promise<Direccion> {
    const direccion = { ...data, idDireccion: this.direccionSeq++ };
    this.direcciones.push(direccion);
    return Promise.resolve(structuredClone(direccion));
  }

  actualizarDireccion(direccion: Direccion): Promise<Direccion> {
    this.direcciones = this.direcciones.map((item) =>
      item.idDireccion === direccion.idDireccion
        ? structuredClone(direccion)
        : item,
    );
    return Promise.resolve(structuredClone(direccion));
  }

  listarContactos(): Promise<ContactoProveedor[]> {
    return Promise.resolve(structuredClone(this.contactos));
  }

  crearContacto(
    data: Omit<ContactoProveedor, 'idContacto'>,
  ): Promise<ContactoProveedor> {
    const contacto = { ...data, idContacto: this.contactoSeq++ };
    this.contactos.push(contacto);
    return Promise.resolve(structuredClone(contacto));
  }

  actualizarContacto(contacto: ContactoProveedor): Promise<ContactoProveedor> {
    this.contactos = this.contactos.map((item) =>
      item.idContacto === contacto.idContacto
        ? structuredClone(contacto)
        : item,
    );
    return Promise.resolve(structuredClone(contacto));
  }

  actualizarContactos(contactos: ContactoProveedor[]): Promise<void> {
    contactos.forEach((contacto) => {
      this.contactos = this.contactos.map((item) =>
        item.idContacto === contacto.idContacto
          ? structuredClone(contacto)
          : item,
      );
    });
    return Promise.resolve();
  }

  listarSolicitudes(): Promise<SolicitudCompra[]> {
    return Promise.resolve(structuredClone(this.solicitudes));
  }

  listarDetalles(): Promise<DetalleSolicitud[]> {
    return Promise.resolve(structuredClone(this.detalles));
  }

  listarAutorizaciones(): Promise<AutorizacionCompra[]> {
    return Promise.resolve(structuredClone(this.autorizaciones));
  }

  crearSolicitud(data: CrearSolicitudData): Promise<SolicitudCreada> {
    const idSolicitud = this.solicitudSeq++;
    const solicitud: SolicitudCompra = {
      ...data.solicitud,
      idSolicitud,
      numeroReferencia: data.numeroReferenciaFactory(idSolicitud),
    };
    const detalles = data.detalles.map((detalle) => ({
      ...detalle,
      idDetalle: this.detalleSeq++,
      idSolicitud,
    }));
    const autorizacion: AutorizacionCompra = {
      ...data.autorizacion,
      idAutorizacion: this.autorizacionSeq++,
      idSolicitud,
    };

    this.solicitudes.push(solicitud);
    this.detalles.push(...detalles);
    this.autorizaciones.push(autorizacion);

    return Promise.resolve({
      solicitud: structuredClone(solicitud),
      detalles: structuredClone(detalles),
      autorizacion: structuredClone(autorizacion),
    });
  }

  actualizarAutorizacion(
    autorizacion: AutorizacionCompra,
  ): Promise<AutorizacionCompra> {
    this.autorizaciones = this.autorizaciones.map((item) =>
      item.idAutorizacion === autorizacion.idAutorizacion
        ? structuredClone(autorizacion)
        : item,
    );
    return Promise.resolve(structuredClone(autorizacion));
  }
}
