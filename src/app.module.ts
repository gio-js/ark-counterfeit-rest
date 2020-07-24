import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppManufacturerController } from './app.manufacturer.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [AppManufacturerController],
  providers: [AppService],
})
export class AppModule {}
