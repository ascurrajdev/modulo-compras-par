import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ComprasService } from './compras.service';

@Controller('compras/v3')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get('proveedores')
  listarProveedores(@Query() query: Record<string, any>) {
    return this.comprasService.listarProveedores(query);
  }

  @Post('proveedores')
  crearProveedor(@Body() body: Record<string, any>) {
    return this.comprasService.crearProveedor(body);
  }

  @Get('proveedores/:proveedorId')
  obtenerProveedor(
    @Param('proveedorId') proveedorId: string,
    @Query('vista') vista?: string,
  ) {
    return this.comprasService.obtenerProveedor(Number(proveedorId), vista);
  }

  @Patch('proveedores/:proveedorId')
  actualizarProveedor(
    @Param('proveedorId') proveedorId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.comprasService.actualizarProveedor(Number(proveedorId), body);
  }

  @Get('proveedores/:proveedorId/direcciones')
  listarDirecciones(
    @Param('proveedorId') proveedorId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.comprasService.listarDirecciones(Number(proveedorId), query);
  }

  @Post('proveedores/:proveedorId/direcciones')
  crearDireccion(
    @Param('proveedorId') proveedorId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.comprasService.crearDireccion(Number(proveedorId), body);
  }

  @Get('proveedores/:proveedorId/direcciones/:direccionId')
  obtenerDireccion(
    @Param('proveedorId') proveedorId: string,
    @Param('direccionId') direccionId: string,
  ) {
    return this.comprasService.obtenerDireccion(
      Number(proveedorId),
      Number(direccionId),
    );
  }

  @Patch('proveedores/:proveedorId/direcciones/:direccionId')
  actualizarDireccion(
    @Param('proveedorId') proveedorId: string,
    @Param('direccionId') direccionId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.comprasService.actualizarDireccion(
      Number(proveedorId),
      Number(direccionId),
      body,
    );
  }

  @Get('proveedores/:proveedorId/contactos')
  listarContactos(
    @Param('proveedorId') proveedorId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.comprasService.listarContactos(Number(proveedorId), query);
  }

  @Post('proveedores/:proveedorId/contactos')
  crearContacto(
    @Param('proveedorId') proveedorId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.comprasService.crearContacto(Number(proveedorId), body);
  }

  @Get('proveedores/:proveedorId/contactos/:contactoId')
  obtenerContacto(
    @Param('proveedorId') proveedorId: string,
    @Param('contactoId') contactoId: string,
  ) {
    return this.comprasService.obtenerContacto(
      Number(proveedorId),
      Number(contactoId),
    );
  }

  @Patch('proveedores/:proveedorId/contactos/:contactoId')
  actualizarContacto(
    @Param('proveedorId') proveedorId: string,
    @Param('contactoId') contactoId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.comprasService.actualizarContacto(
      Number(proveedorId),
      Number(contactoId),
      body,
    );
  }

  @Get('solicitudes-compra')
  listarSolicitudes(@Query() query: Record<string, any>) {
    return this.comprasService.listarSolicitudes(query);
  }

  @Post('solicitudes-compra')
  crearSolicitud(@Body() body: Record<string, any>) {
    return this.comprasService.crearSolicitud(body);
  }

  @Get('solicitudes-compra/:solicitudId')
  obtenerSolicitud(
    @Param('solicitudId') solicitudId: string,
    @Query('vista') vista?: string,
  ) {
    return this.comprasService.obtenerSolicitud(Number(solicitudId), vista);
  }

  @Get('solicitudes-compra/:solicitudId/autorizacion')
  obtenerAutorizacionPorSolicitud(
    @Param('solicitudId') solicitudId: string,
    @Query('vista') vista?: string,
  ) {
    return this.comprasService.obtenerAutorizacionPorSolicitud(
      Number(solicitudId),
      vista,
    );
  }

  @Post('solicitudes-compra/:solicitudId/reintentos-publicacion')
  @HttpCode(202)
  reintentarPublicacion(@Param('solicitudId') solicitudId: string) {
    return this.comprasService.reintentarPublicacion(Number(solicitudId));
  }

  @Get('autorizaciones-compra')
  listarAutorizaciones(@Query() query: Record<string, any>) {
    return this.comprasService.listarAutorizaciones(query);
  }

  @Get('autorizaciones-compra/:autorizacionId')
  obtenerAutorizacion(
    @Param('autorizacionId') autorizacionId: string,
    @Query('vista') vista?: string,
  ) {
    return this.comprasService.obtenerAutorizacion(
      Number(autorizacionId),
      vista,
    );
  }
}
