import { TransactionService } from './services/app.transactionService';
import { Controller, Post, HttpService, Param, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { AnticounterfeitRegisterManufacturerTransaction } from 'common/ark-counterfeit-common';
import { RestResponse } from './model/restResponse';
import { ConfigService } from '@nestjs/config';
import { RegisterManufacturerResponse } from './model/registerManufacturerResponse';
import { Identities } from '@arkecosystem/crypto';

@Controller("api/manufacturer")
export class AppManufacturerController {
  private readonly service: TransactionService;
  private rootPassphrase: string = "";

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private httpService: HttpService) {

    // get an environment variable
    const uri = this.configService.get<string>('ARK_HTTP_SERVER_URI');
    this.rootPassphrase = this.configService.get<string>('ANTICOUNTERFEIT_ROOT_PASSPHRASE');

    // request to http ark.io service
    this.service = new TransactionService(uri);

  }

  @Post()
  async createManufacturer(@Body() model: AnticounterfeitRegisterManufacturerTransaction):
    Promise<RestResponse<RegisterManufacturerResponse>> {
    try {

      const manufacturerPassphrase: string = this.service.GenerateRandomPassphrase();
      const manufacturerAddressId: string = Identities.Address.fromPassphrase(manufacturerPassphrase);
      const manufacturerPublicKey: string = Identities.PublicKey.fromPassphrase(manufacturerPassphrase);
      const manufacturerPrivateKey: string = Identities.PrivateKey.fromPassphrase(manufacturerPassphrase);

      const serviceResult = await this.service.SendManufacturerTransaction(
        this.rootPassphrase,
        manufacturerAddressId, model.ProductPrefixId,
        model.CompanyName, model.CompanyFiscalCode);

      return {
        RestResponse: serviceResult,
        IsSuccess: true,
        Data: {
          ManufacturerAddressId: manufacturerAddressId,
          ManufacturerPublicKey: manufacturerPublicKey,
          ManufacturerPrivateKey: manufacturerPrivateKey,
          ManufacturerPassphrase: manufacturerPassphrase
        }
      } as RestResponse<RegisterManufacturerResponse>;

    } catch (ex) {

      return {
        RestErrorResponse: ex.response,
        IsSuccess: false
      } as RestResponse<RegisterManufacturerResponse>;

    }
  }
}
