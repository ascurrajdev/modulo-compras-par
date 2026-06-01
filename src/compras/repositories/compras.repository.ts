import {
  AutorizacionCompra,
  ContactoProveedor,
  DetalleSolicitud,
  Direccion,
  Proveedor,
  SolicitudCompra,
} from '../compras.types';

export const COMPRAS_REPOSITORY = Symbol('COMPRAS_REPOSITORY');

export interface CrearSolicitudData {
  solicitud: Omit<SolicitudCompra, 'idSolicitud' | 'numeroReferencia'>;
  detalles: Array<Omit<DetalleSolicitud, 'idDetalle' | 'idSolicitud'>>;
  autorizacion: Omit<AutorizacionCompra, 'idAutorizacion' | 'idSolicitud'>;
  numeroReferenciaFactory: (idSolicitud: number) => string;
}

export interface SolicitudCreada {
  solicitud: SolicitudCompra;
  detalles: DetalleSolicitud[];
  autorizacion: AutorizacionCompra;
}

export interface ComprasRepository {
  listarProveedores(): Promise<Proveedor[]>;
  crearProveedor(data: Omit<Proveedor, 'idProveedor'>): Promise<Proveedor>;
  actualizarProveedor(proveedor: Proveedor): Promise<Proveedor>;

  listarDirecciones(): Promise<Direccion[]>;
  crearDireccion(data: Omit<Direccion, 'idDireccion'>): Promise<Direccion>;
  actualizarDireccion(direccion: Direccion): Promise<Direccion>;

  listarContactos(): Promise<ContactoProveedor[]>;
  crearContacto(
    data: Omit<ContactoProveedor, 'idContacto'>,
  ): Promise<ContactoProveedor>;
  actualizarContacto(contacto: ContactoProveedor): Promise<ContactoProveedor>;
  actualizarContactos(contactos: ContactoProveedor[]): Promise<void>;

  listarSolicitudes(): Promise<SolicitudCompra[]>;
  listarDetalles(): Promise<DetalleSolicitud[]>;
  listarAutorizaciones(): Promise<AutorizacionCompra[]>;
  crearSolicitud(data: CrearSolicitudData): Promise<SolicitudCreada>;
  actualizarAutorizacion(
    autorizacion: AutorizacionCompra,
  ): Promise<AutorizacionCompra>;
}
