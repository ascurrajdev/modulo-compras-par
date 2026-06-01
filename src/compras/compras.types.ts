export type EstadoGeneral = 'ACTIVO' | 'INACTIVO';
export type EstadoSolicitudCompra = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type EstadoAutorizacionCompra =
  | 'PENDIENTE_ENVIO'
  | 'ENVIANDO'
  | 'EN_PROCESO'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'ERROR_KAFKA';
export type ResultadoCaja = 'APROBADA' | 'RECHAZADA';
export type Vista = 1 | 2 | 3;

export interface Proveedor {
  idProveedor: number;
  descripcion: string;
  ruc: string;
  estado: EstadoGeneral;
  fechaRegistro: string;
}

export interface Direccion {
  idDireccion: number;
  idProveedor: number;
  departamento: string;
  ciudad: string;
  barrio: string | null;
  callePrincipal: string;
  calleSecundaria: string | null;
  numero: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoGeneral;
}

export interface ContactoProveedor {
  idContacto: number;
  idProveedor: number;
  nombre: string;
  apellido: string;
  cargo: string | null;
  email: string;
  telefonoPrincipal: string;
  telefonoSecundario: string | null;
  esPrincipal: boolean;
  estado: EstadoGeneral;
}

export interface DetalleSolicitud {
  idDetalle: number;
  idSolicitud: number;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  iva5: number;
  iva10: number;
  exenta: number;
  subtotal: number;
}

export interface SolicitudCompra {
  idSolicitud: number;
  numeroReferencia: string;
  idProveedor: number;
  descripcion: string | null;
  estado: EstadoSolicitudCompra;
  subtotalIva5: number;
  subtotalIva10: number;
  subtotalExenta: number;
  montoTotal: number;
  fechaCreacion: string;
  fechaReqEntrega: string | null;
}

export interface AutorizacionCompra {
  idAutorizacion: number;
  idSolicitud: number;
  estado: EstadoAutorizacionCompra;
  kafkaMessageId: string | null;
  fechaEnvioKafka: string | null;
  fechaRespuestaCaja: string | null;
  resultadoCaja: ResultadoCaja | null;
  observacion: string | null;
}

export interface PageQuery {
  page?: unknown;
  size?: unknown;
}

export interface Paginated<T> {
  page: number;
  size: number;
  total: number;
  data: T[];
}
