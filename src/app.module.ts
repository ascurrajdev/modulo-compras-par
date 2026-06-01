import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComprasModule } from './compras/compras.module';

@Module({
  imports: [ComprasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
