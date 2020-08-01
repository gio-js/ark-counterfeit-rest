import { TransactionService } from './services/app.transactionService';
import { Controller, Post, HttpService, Param, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AnticounterfeitRegisterManufacturerTransaction } from 'common/ark-counterfeit-common';
import { ConfigService } from '@nestjs/config';
import { Identities } from '@arkecosystem/crypto';
import { RestResponse, RegisterAccountResponse } from 'common/ark-counterfeit-common/src/rest/models';

@Controller("api/account")
export class AppAccountController {
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
  async createAccount(@Body() model: any): Promise<RestResponse<RegisterAccountResponse>> {
    try {

      console.log(model.Username)
      const accountNewPassphrase: string = this.service.GenerateRandomPassphrase();

      const serviceResult = await this.service.RegisterNewWallet(this.rootPassphrase, accountNewPassphrase, model.Username);

      if (serviceResult.body.errors) {
        return {
          RestErrorResponse: serviceResult,
          IsSuccess: false
        } as RestResponse<RegisterAccountResponse>;
      }

      return {
        //RestResponse: serviceResult,
        IsSuccess: true,
        Data: {
          Username: model.Username,
          Passphrase: accountNewPassphrase
        }
      } as RestResponse<RegisterAccountResponse>;

    } catch (ex) {

      return {
        RestErrorResponse: ex.response,
        IsSuccess: false
      } as RestResponse<RegisterAccountResponse>;

    }
  }

  @Get(":Username/exists")
  async existsAccount(@Param() model: any): Promise<RestResponse<boolean>> {
    try {

      console.log(model.Username)
      const accountNewPassphrase: string = this.service.GenerateRandomPassphrase();

      const serviceResult = await this.service.GetDelegateWalletByUsername(model.Username);

      if (serviceResult.body.errors) {
        return {
          RestErrorResponse: serviceResult,
          IsSuccess: false
        } as RestResponse<boolean>;
      }

      return {
        //RestResponse: serviceResult,
        IsSuccess: true,
        Data: (serviceResult.body.data.length === 1)
      } as RestResponse<boolean>;

    } catch (ex) {

      return {
        RestErrorResponse: ex.response,
        IsSuccess: false
      } as RestResponse<boolean>;

    }
  }

}
