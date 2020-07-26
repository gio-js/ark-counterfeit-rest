import { Connection } from '@arkecosystem/client'
import { Identities, Managers, Transactions } from '@arkecosystem/crypto'
import { RegisterManufacturerBuilder, RegisterManufacturerTransaction } from 'common/ark-counterfeit-common';
import { BigNumber } from '@arkecosystem/crypto/dist/utils';
import { generateMnemonic } from 'bip39';

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
        //Transactions.BuilderFactory.delegateRegistration().usernameAsset
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

    /** Broadcast transaction on ark net */
    private async sendTransaction(transaction: any): Promise<any> {
        return await this.connection.api('transactions').create({ transactions: [transaction] });
    }

    /** Generates a random words list as passphrase */
    public GenerateRandomPassphrase = (): string => {
        return generateMnemonic();
        //return getAccountDataFromPassphrase(passphrase);
    };

    /** Creates and send a new manufacturer declaration transaction */
    public async SendManufacturerTransaction(
        rootPassphrase: string, 
        manufacturerPassphrase: string, 
        prefixId: string, companyName: string, fiscalCode: string): Promise<any> {

        const senderAddressId: string = Identities.Address.fromPassphrase(rootPassphrase);
        const manufacturerAddressId: string = Identities.Address.fromPassphrase(manufacturerPassphrase);

        const nonce = await this.getNextNonce(senderAddressId);
        const builder = new RegisterManufacturerBuilder();
        const transaction = builder
            .nonce(nonce)
            .manufacturer(manufacturerAddressId, prefixId, companyName, fiscalCode)
            .vendorField(this.vendorField)
            .recipientId(manufacturerAddressId)
            .sign(rootPassphrase)
            .getStruct();

        console.log(JSON.stringify(transaction));

        return await this.sendTransaction(transaction);
    }


}