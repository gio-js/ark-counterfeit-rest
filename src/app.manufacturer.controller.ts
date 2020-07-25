import { TransactionService } from './services/app.transactionService';
import { Controller, Post, HttpService, Param, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { AnticounterfeitRegisterManufacturerTransaction } from 'common/ark-counterfeit-common';
import { RestResponse } from './model/restResponse';
import { ConfigService } from '@nestjs/config';

@Controller("api/manufacturer")
export class AppManufacturerController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private httpService: HttpService) { }

  @Post()
  async createManufacturer(@Body() model: AnticounterfeitRegisterManufacturerTransaction): Promise<RestResponse> {
    try {
      // get an environment variable
      const uri = this.configService.get<string>('ARK_HTTP_SERVER_URI');
      const rootPassphrase = this.configService.get<string>('ANTICOUNTERFEIT_ROOT_PASSPHRASE');

      // request to http ark.io service
      const service = new TransactionService(uri);
      const serviceResult = await service.sendManufacturerTransaction(rootPassphrase,
        model.ManufacturerAddressId, model.ProductPrefixId,
        model.CompanyName, model.CompanyFiscalCode);

      return {
        Data: serviceResult,
        IsSuccess: true
      } as RestResponse;
    } catch (ex) {
      
      return {
        Data: ex.response,
        IsSuccess: false
      } as RestResponse;

    }
  }
}
