import { Connection } from '@arkecosystem/client'
import { Identities } from '@arkecosystem/crypto'
import { RegisterManufacturerBuilder } from 'common/ark-counterfeit-common';
import { ITransactionData } from '@arkecosystem/crypto/dist/interfaces';

export class TransactionService {

    private readonly connection: Connection;
    private readonly vendorField: string = "UniMi-AnticounterfeitProject";

    constructor(arkApiUri: string) {
        this.connection = new Connection(arkApiUri)
    }

    /** Get a wallet */
    private getWallet = async (walletAddress: string) => {
        return (await this.connection.api('wallets').get(walletAddress)).body.data;
    }

    /** Get a wallet next transaction nonce */
    private getNextNonce = async (walletAddress: string) => {
        const nonce = (await this.getWallet(walletAddress)).nonce;
        return (parseInt(nonce, 10) + 1).toString()
    }

    private async sendTransaction(transaction: ITransactionData) {
        await this.connection.api('transactions').create({ transactions: [transaction] });
    }

    public async sendManufacturerTransaction(
        senderPublicKey: string, passphrase: string, 
        manufacturerAddressId: string, prefixId: string,
        companyName: string, fiscalCode: string): Promise<any> {

        const senderAddressId: string = Identities.Address.fromPublicKey(senderPublicKey);
        const nonce = await this.getNextNonce(senderAddressId);
        const builder = new RegisterManufacturerBuilder();
        const transaction = builder.nonce(nonce)
            .manufacturer(manufacturerAddressId, prefixId, companyName, fiscalCode)
            .vendorField(this.vendorField)
            .sign(passphrase)
            .getStruct();

        return this.sendTransaction(transaction);
        // let transaction = {
        //     "version": 2,
        //     "network": 23,
        //     "typeGroup": 1001,
        //     "type": 100,
        //     "nonce": null,
        //     "senderPublicKey": senderPublicKey, //"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        //     "fee": "100000000",
        //     "amount": "0",
        //     "asset": asset,
        //     //"signature": "809dac6e3077d6ae2083b353b6020badc37195c286079d466bb1d6670ed4e9628a5b5d0a621801e2763aae5add41905036ed8d21609ed9ddde9f941bd066833c",
        //     //"id": "b567325019edeef0ce5a1134af0b642a54ed2a8266a406e1a999f5d590eb5c3c"
        // };




        // transaction.nonce = this.getNextNonce(senderAddressId);


    }


}