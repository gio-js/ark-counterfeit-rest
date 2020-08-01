import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppManufacturerController } from './app.manufacturer.controller';
import { AppService } from './app.service';
import { AppAccountController } from './app.account.controller';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [AppManufacturerController, AppAccountController],
  providers: [AppService],
})
export class AppModule {}
