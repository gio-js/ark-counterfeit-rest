import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getHello(): string {
    return 'Ark.io Anticounterfeit Service';
  }
  
}
