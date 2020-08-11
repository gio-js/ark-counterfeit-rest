import { TransactionService } from './services/app.transactionService';
import { Controller, Post, HttpService, Param, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AnticounterfeitRegisterManufacturerTransaction } from 'common/ark-counterfeit-common';
import { ConfigService } from '@nestjs/config';
import { Identities } from '@arkecosystem/crypto';
import {
  RegisterManufacturerResponse, RestResponse,
  ManufacturerResponse
} from 'common/ark-counterfeit-common/src/rest/models';

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
  async createManufacturer(@Body() model: AnticounterfeitRegisterManufacturerTransaction): Promise<RestResponse<RegisterManufacturerResponse>> {
    const result = { IsSuccess: true } as RestResponse<RegisterManufacturerResponse>;

    try {
      // genera nuova passphrase
      const manufacturerPassphrase: string = this.service.GenerateRandomPassphrase();
      const manufacturerAddressId: string = Identities.Address.fromPassphrase(manufacturerPassphrase);
      const manufacturerPublicKey: string = Identities.PublicKey.fromPassphrase(manufacturerPassphrase);
      const manufacturerPrivateKey: string = Identities.PrivateKey.fromPassphrase(manufacturerPassphrase);

      const serviceResult = await this.service.SendManufacturerTransaction(
        this.rootPassphrase,
        manufacturerPassphrase,
        model.ProductPrefixId, model.CompanyName, model.CompanyFiscalCode, model.RegistrationContract);

      if (serviceResult.body.errors) {
        result.RestErrorResponse = serviceResult;
        result.IsSuccess = false
      } else {
        result.Data = {
          ManufacturerAddressId: manufacturerAddressId,
          ManufacturerPublicKey: manufacturerPublicKey,
          ManufacturerPrivateKey: manufacturerPrivateKey,
          ManufacturerPassphrase: manufacturerPassphrase
        };
      }


    } catch (ex) {
      result.RestErrorResponse = (ex.response || ex.toString());
      result.IsSuccess = false;
    }

    return result;
  }

  @Get()
  async registeredManufacturers(): Promise<RestResponse<ManufacturerResponse[]>> {
    const result = { IsSuccess: true } as RestResponse<ManufacturerResponse[]>
    try {
      const serviceResult = await this.service.GetRegisteredManufacturers();

      if (serviceResult.body.errors) {
        result.RestErrorResponse = serviceResult;
        result.IsSuccess = false;
      } else {
        result.Data = serviceResult.body.data.map(x => {
          const transactionAsset = x.asset.AnticounterfeitRegisterManufacturerTransaction;
          return {
            AddressId: x.recipient,
            ProductPrefixId: transactionAsset.ProductPrefixId,
            CompanyName: transactionAsset.CompanyName,
            CompanyFiscalCode: transactionAsset.CompanyFiscalCode,
            RegistrationContract: transactionAsset.RegistrationContract
          };
        });
      }
    } catch (ex) {
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false;
    }
    return result;
  }

  @Get("nonce/:id")
  async getNextNonce(@Param() params: any): Promise<RestResponse<string>> {
    const result = { IsSuccess: true } as RestResponse<string>

    try {
      result.Data = await this.service.GetNextNonce(params.id);
    } catch (ex) {
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false;
    }
    return result;
  }

}
