import { Test, TestingModule } from '@nestjs/testing';
import { ComprasService } from './compras.service';
import { COMPRAS_PUBLISHER } from './publishers/compras-publisher';
import { InMemoryComprasPublisher } from './publishers/in-memory-compras.publisher';
import { COMPRAS_REPOSITORY } from './repositories/compras.repository';
import { InMemoryComprasRepository } from './repositories/in-memory-compras.repository';

interface SolicitudTestResponse {
  data: {
    idSolicitud: number;
    idProveedor: number;
    estado: string;
    subtotalIva5: number;
    subtotalIva10: number;
    subtotalExenta: number;
    montoTotal: number;
    items: unknown[];
    autorizacion: {
      idSolicitud: number;
      estado: string;
    };
  };
}

interface ContactosTestResponse {
  data: Array<{
    nombre: string;
    esPrincipal: boolean;
  }>;
}

describe('ComprasService', () => {
  let service: ComprasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprasService,
        {
          provide: COMPRAS_REPOSITORY,
          useClass: InMemoryComprasRepository,
        },
        {
          provide: COMPRAS_PUBLISHER,
          useClass: InMemoryComprasPublisher,
        },
      ],
    }).compile();

    service = module.get<ComprasService>(ComprasService);
  });

  it('crea una solicitud con totales, detalle y autorizacion inicial', async () => {
    const response = (await service.crearSolicitud({
      idProveedor: 1,
      descripcion: 'Reposicion de repuestos',
      items: [
        {
          productoId: 'PROD-0091',
          productoNombre: 'Filtro de aceite',
          cantidad: 10,
          precioUnitario: 50000,
          iva10: 500000,
        },
      ],
    })) as unknown as SolicitudTestResponse;

    expect(response.data).toMatchObject({
      idProveedor: 1,
      estado: 'PENDIENTE',
      subtotalIva5: 0,
      subtotalIva10: 500000,
      subtotalExenta: 0,
      montoTotal: 500000,
    });
    expect(response.data.items).toHaveLength(1);
    expect(response.data.autorizacion).toMatchObject({
      idSolicitud: response.data.idSolicitud,
      estado: 'EN_PROCESO',
    });
  });

  it('mantiene un solo contacto principal por proveedor', async () => {
    await service.crearContacto(1, {
      nombre: 'Ana',
      apellido: 'Lopez',
      email: 'ana@example.com',
      telefonoPrincipal: '+595981222333',
      esPrincipal: true,
    });

    const response = (await service.listarContactos(
      1,
      {},
    )) as unknown as ContactosTestResponse;
    const principales = response.data.filter(
      (contacto) => contacto.esPrincipal,
    );

    expect(principales).toHaveLength(1);
    expect(principales[0].nombre).toBe('Ana');
  });

  it('rechaza RUC duplicado', async () => {
    await expect(
      service.crearProveedor({
        descripcion: 'Proveedor duplicado',
        ruc: '80123456-7',
      }),
    ).rejects.toThrow();
  });
});
