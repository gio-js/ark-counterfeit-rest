import { Connection } from '@arkecosystem/client'
import { Identities, Managers, Transactions } from '@arkecosystem/crypto'
import { RegisterManufacturerBuilder, RegisterManufacturerTransaction } from 'common/ark-counterfeit-common';
import { ITransactionData } from '@arkecosystem/crypto/dist/interfaces';

export class TransactionService {

    private readonly connection: Connection;
    private readonly vendorField: string = "UniMi-AnticounterfeitProject";
    private readonly network = 'testnet';

    constructor(arkApiUri: string) {
        this.connection = new Connection(arkApiUri);
        this.initCrypto();
    }

    /**
     * Initialize `@arkecosystem/crypto` lib settings
     * Set the latest available block height to use latest features
     */
    private initCrypto = async () => {
        Managers.configManager.setFromPreset(this.network);
        Managers.configManager.setHeight(await this.getLatestBlockHeight());
        Transactions.TransactionRegistry.registerTransactionType(RegisterManufacturerTransaction);
    }

    /** Get a wallet */
    private getWallet = async (walletAddress: string) => {
        return (await this.connection.api('wallets').get(walletAddress)).body.data;
    }

    /** Fetch the latest block height */
    private getLatestBlockHeight = async (): Promise<number> => (await this.connection.get('blockchain')).body.data.block.height

    /** Get a wallet next transaction nonce */
    private getNextNonce = async (walletAddress: string) => {
        const nonce = (await this.getWallet(walletAddress)).nonce;
        return (parseInt(nonce, 10) + 1).toString()
    }

    private async sendTransaction(transaction: ITransactionData): Promise<any> {
        return await this.connection.api('transactions').create({ transactions: [transaction] });
    }

    public async sendManufacturerTransaction(
        passphrase: string, 
        manufacturerAddressId: string, prefixId: string,
        companyName: string, fiscalCode: string): Promise<any> {

        const senderAddressId: string = Identities.Address.fromPassphrase(passphrase);
        console.log(senderAddressId);

        const nonce = await this.getNextNonce(senderAddressId);
        const builder = new RegisterManufacturerBuilder();
        const transaction = builder.nonce(nonce)
            .manufacturer(manufacturerAddressId, prefixId, companyName, fiscalCode)
            .vendorField(this.vendorField)
            .sign(passphrase)
            .getStruct();

        console.log(JSON.stringify(transaction));

        return await this.sendTransaction(transaction);
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