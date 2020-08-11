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

@Controller("api/blockchain")
export class AppBlockchainController {
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

  @Get("height")
  async getHeight(): Promise<RestResponse<number>> {
    const result = { IsSuccess: true } as RestResponse<number>

    try {
      result.Data = await this.service.GetBlockchainHeight();
    } catch (ex) {
      result.RestErrorResponse = ex.response;
      result.IsSuccess = false;
    }
    return result;
  }

}
