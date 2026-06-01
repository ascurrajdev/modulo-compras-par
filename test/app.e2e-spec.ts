import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ProveedoresResponse {
  total: number;
  data: Array<Record<string, unknown>>;
}

interface ProveedorCreateResponse {
  data: {
    idProveedor: number;
  };
}

interface SolicitudCreateResponse {
  data: {
    idProveedor: number;
    estado: string;
    subtotalIva10: number;
    montoTotal: number;
    autorizacion: {
      kafkaMessageId: string;
    };
  };
}

describe('Compras API (e2e)', () => {
  const apiKey = 'test-api-key';
  let app: INestApplication<App>;
  let previousApiKey: string | undefined;

  beforeAll(() => {
    previousApiKey = process.env.COMPRAS_API_KEY;
    process.env.COMPRAS_API_KEY = apiKey;
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    if (previousApiKey === undefined) {
      delete process.env.COMPRAS_API_KEY;
      return;
    }

    process.env.COMPRAS_API_KEY = previousApiKey;
  });

  it('rechaza requests sin x-api-key', async () => {
    await request(app.getHttpServer())
      .get('/compras/v3/proveedores?vista=3')
      .expect(401);
  });

  it('lista proveedores con vista 3', async () => {
    const response = await request(app.getHttpServer())
      .get('/compras/v3/proveedores?vista=3')
      .set('x-api-key', apiKey)
      .expect(200);

    const body = response.body as ProveedoresResponse;

    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toHaveProperty('direcciones');
    expect(body.data[0]).toHaveProperty('contactos');
  });

  it('crea proveedor y solicitud de compra', async () => {
    const ruc = `${Math.floor(10000000 + Math.random() * 89999999)}-1`;

    const proveedorResponse = await request(app.getHttpServer())
      .post('/compras/v3/proveedores')
      .set('x-api-key', apiKey)
      .send({
        descripcion: 'Importadora del Sur S.R.L.',
        ruc,
      })
      .expect(201);

    const proveedorBody = proveedorResponse.body as ProveedorCreateResponse;

    const solicitudResponse = await request(app.getHttpServer())
      .post('/compras/v3/solicitudes-compra')
      .set('x-api-key', apiKey)
      .send({
        idProveedor: proveedorBody.data.idProveedor,
        descripcion: 'Compra de insumos',
        items: [
          {
            productoId: 'PROD-100',
            productoNombre: 'Caja de tornillos',
            cantidad: 3,
            precioUnitario: 12000,
            iva5: 0,
            iva10: 36000,
            exenta: 0,
          },
        ],
      })
      .expect(201);

    const solicitudBody = solicitudResponse.body as SolicitudCreateResponse;

    expect(solicitudBody.data).toMatchObject({
      idProveedor: proveedorBody.data.idProveedor,
      estado: 'PENDIENTE',
      subtotalIva10: 36000,
      montoTotal: 36000,
    });
    expect(solicitudBody.data.autorizacion.kafkaMessageId).toMatch(/^msg-/);
  });
});
