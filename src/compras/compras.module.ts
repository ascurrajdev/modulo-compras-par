import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { comprasEntities } from '../database/typeorm.options';
import { ComprasController } from './compras.controller';
import { ComprasService } from './compras.service';
import { COMPRAS_REPOSITORY } from './repositories/compras.repository';
import { TypeOrmComprasRepository } from './repositories/typeorm-compras.repository';

@Module({
  imports: [TypeOrmModule.forFeature(comprasEntities)],
  controllers: [ComprasController],
  providers: [
    ComprasService,
    {
      provide: COMPRAS_REPOSITORY,
      useClass: TypeOrmComprasRepository,
    },
  ],
  exports: [ComprasService],
})
export class ComprasModule {}
