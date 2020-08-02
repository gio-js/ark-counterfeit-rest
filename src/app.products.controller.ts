import { TransactionService } from './services/app.transactionService';
import { Controller, Post, HttpService, Param, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AnticounterfeitRegisterManufacturerTransaction, AnticounterfeitRegisterProductTransaction } from 'common/ark-counterfeit-common';
import { ConfigService } from '@nestjs/config';
import { Identities } from '@arkecosystem/crypto';
import { RestResponse, RegisterAccountResponse, RestTransactionContainer } from 'common/ark-counterfeit-common/src/rest/models';

@Controller("api/products")
export class AppProductsController {
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
  async registerProduct(@Body() model: RestTransactionContainer<AnticounterfeitRegisterProductTransaction>):
    Promise<RestResponse<any>> {
    try {

      console.log(JSON.stringify(model));
      const serviceResult = await this.service.RegisterProduct(model);

      if (serviceResult.body.errors) {
        return {
          RestErrorResponse: serviceResult,
          IsSuccess: false
        } as RestResponse<RegisterAccountResponse>;
      }

      return {
        IsSuccess: true,
        Data: null
      } as RestResponse<RegisterAccountResponse>;

    } catch (ex) {

      return {
        RestErrorResponse: ex.response,
        IsSuccess: false
      } as RestResponse<RegisterAccountResponse>;

    }
  }

}
