import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppManufacturerController } from './app.manufacturer.controller';
import { AppService } from './app.service';
import { AppAccountController } from './app.account.controller';
import { AppProductsController } from './app.products.controller';
import { AppBlockchainController } from './app.blockchain.controller';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [
    AppManufacturerController,
    AppAccountController,
    AppProductsController,
    AppBlockchainController],
  providers: [AppService],
})
export class AppModule { }
