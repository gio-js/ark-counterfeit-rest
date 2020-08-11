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
  async registerProduct(@Body() model: RestTransactionContainer<AnticounterfeitRegisterProductTransaction>): Promise<RestResponse<any>> {
    const result = { IsSuccess: true } as RestResponse<any>;
    try {

      console.log(JSON.stringify(model));
      const serviceResult = await this.service.RegisterProduct(model);

      console.log(JSON.stringify(serviceResult));

      if (serviceResult.body.errors) {
        result.RestErrorResponse = serviceResult;
        result.IsSuccess = false
      }

    } catch (ex) {
      console.error(ex);
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false
    }

    return result;
  }

  @Get()
  async registeredProducts(): Promise<RestResponse<AnticounterfeitRegisterProductTransaction[]>> {
    const result = { IsSuccess: true } as RestResponse<AnticounterfeitRegisterProductTransaction[]>;
    try {

      const serviceResult = await this.service.GetRegisteredProducts(null, null);
      console.log(JSON.stringify(serviceResult));
      if (serviceResult.body.errors) {
        result.RestErrorResponse = serviceResult;
        result.IsSuccess = false
      } else {
        result.Data = serviceResult.body.data.map(x => x.asset.AnticounterfeitRegisterProductTransaction as AnticounterfeitRegisterProductTransaction);
      }

    } catch (ex) {
      console.error(ex);
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false
    }

    return result;
  }

  @Get(':productId')
  async registeredProductsById(@Param() params: any): Promise<RestResponse<AnticounterfeitRegisterProductTransaction>> {
    const result = { IsSuccess: true } as RestResponse<AnticounterfeitRegisterProductTransaction>;
    try {

      const serviceResult = await this.service.GetRegisteredProducts(null, params.productId);
      console.log(JSON.stringify(serviceResult));
      if (serviceResult.body.errors) {
        result.RestErrorResponse = serviceResult;
        result.IsSuccess = false
      } else {
        result.Data = serviceResult.body.data.map(x => x.asset.AnticounterfeitRegisterProductTransaction as AnticounterfeitRegisterProductTransaction);
      }

    } catch (ex) {
      console.error(ex);
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false
    }

    return result;
  }

  @Get('manufacturer/:manufacturerAddressId')
  async registeredProductsByManufacturerAddressId(@Param() params: any): Promise<RestResponse<AnticounterfeitRegisterProductTransaction>> {
    const result = { IsSuccess: true } as RestResponse<AnticounterfeitRegisterProductTransaction>;
    try {

      const serviceResult = await this.service.GetRegisteredProducts(params.manufacturerAddressId, null);
      console.log(JSON.stringify(serviceResult));
      if (serviceResult.body.errors) {
        result.RestErrorResponse = serviceResult;
        result.IsSuccess = false
      } else {
        result.Data = serviceResult.body.data.map(x => x.asset.AnticounterfeitRegisterProductTransaction as AnticounterfeitRegisterProductTransaction);
      }

    } catch (ex) {
      console.error(ex);
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false
    }

    return result;
  }

}