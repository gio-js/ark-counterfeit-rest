import { Connection, SearchTransactionsApiBody, ApiQuery } from '@arkecosystem/client'
import { Identities, Managers, Transactions } from '@arkecosystem/crypto'
import {
    RegisterManufacturerBuilder,
    RegisterManufacturerTransaction,
    RegisterProductTransaction,
    AnticounterfeitRegisterProductTransaction,
    RegisterProductBuilder
} from 'common/ark-counterfeit-common';
import { BigNumber } from '@arkecosystem/crypto/dist/utils';
import { generateMnemonic } from 'bip39';
import {
    ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
    REGISTER_PRODUCT_TYPE,
    REGISTER_MANUFACTURER_TYPE, VENDOR_FIELD
} from 'common/ark-counterfeit-common/src/const';
import { RestTransactionContainer } from 'common/ark-counterfeit-common/src/rest/models';

export class TransactionService {

    private readonly connection: Connection;
    private readonly vendorField: string = VENDOR_FIELD;
    private readonly network = 'testnet';

    constructor(arkApiUri: string) {
        this.connection = new Connection(arkApiUri);
        this.initCrypto();
    }

    /** Delay function */
    private delay = (duration: number): Promise<Number> =>
        new Promise(resolve => setTimeout(resolve, duration));

    /**
     * Initialize `@arkecosystem/crypto` lib settings
     * Set the latest available block height to use latest features
     */
    private initCrypto = async () => {
        Managers.configManager.setFromPreset(this.network);
        Managers.configManager.setHeight(await this.getLatestBlockHeight());
        Transactions.TransactionRegistry.registerTransactionType(RegisterManufacturerTransaction);
        Transactions.TransactionRegistry.registerTransactionType(RegisterProductTransaction);
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
        console.log(JSON.stringify(transaction));
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
        prefixId: string, companyName: string, fiscalCode: string, registrationContract: string): Promise<any> {

        const senderAddressId: string = Identities.Address.fromPassphrase(rootPassphrase);
        const manufacturerAddressId: string = Identities.Address.fromPassphrase(manufacturerPassphrase);

        const rootNonce = await this.getNextNonce(senderAddressId);
        const transactionTransfer = Transactions.BuilderFactory
            .transfer()
            .nonce(rootNonce)
            .vendorField(this.vendorField)
            .amount('5000000000')
            .recipientId(manufacturerAddressId)
            .sign(rootPassphrase)
            .getStruct();

        await this.sendTransaction(transactionTransfer);

        // Wait for at least one block (+5 sec) to have balance saved
        await this.delay(8000);

        const nonce = await this.getNextNonce(senderAddressId);
        const builder = new RegisterManufacturerBuilder();
        const transaction = builder
            .nonce(nonce)
            .manufacturer(prefixId, companyName, fiscalCode, registrationContract)
            .vendorField(this.vendorField)
            .recipientId(manufacturerAddressId)
            .sign(rootPassphrase)
            .getStruct();

        return await this.sendTransaction(transaction);
    }

    /** Retrieves all the registerd manufacturers */
    public async GetRegisteredManufacturers(): Promise<any> {
        return await this.connection.api('transactions').search(
            {
                typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
                type: REGISTER_MANUFACTURER_TYPE
            } as SearchTransactionsApiBody,
            { page: 1, limit: 100 } as ApiQuery);
    }

    /** Returns the next nonce for a specific manufacturer */
    public async GetNextNonce(manufacturerAddressId: string): Promise<any> {
        return await this.getNextNonce(manufacturerAddressId);
    }

    /** Register a new generic wallet */
    public async RegisterNewWallet(rootPassphrase: string, genericPassphrase: string, userName: string): Promise<any> {
        const rootAddressId: string = Identities.Address.fromPassphrase(rootPassphrase);
        const newAccountAddressId: string = Identities.Address.fromPassphrase(genericPassphrase);

        const rootNonce = await this.getNextNonce(rootAddressId);
        const transactionTransfer = Transactions.BuilderFactory
            .transfer()
            .nonce(rootNonce)
            .vendorField(this.vendorField)
            .amount('5000000000')
            .recipientId(newAccountAddressId)
            .sign(rootPassphrase)
            .getStruct();

        await this.sendTransaction(transactionTransfer);

        // Wait for at least one block (+5 sec) to have balance saved
        await this.delay(8000);

        const nonce = await this.getNextNonce(newAccountAddressId);
        const transactionDelegate = Transactions.BuilderFactory
            .delegateRegistration()
            .usernameAsset(userName)
            .nonce(nonce)
            .vendorField(this.vendorField)
            .sign(genericPassphrase)
            .getStruct();

        return await this.sendTransaction(transactionDelegate);
    }

    /** Retrieves all the registerd manufacturers */
    public async GetDelegateWalletByUsername(userName: string): Promise<any> {
        return await this.connection.api('transactions').search(
            {
                typeGroup: 1,
                type: 2, // delegate registration
                asset: { delegate: { username: userName } }
            } as SearchTransactionsApiBody,
            { page: 1, limit: 2 } as ApiQuery);
    }

    /** Register a new product */
    public async RegisterProduct(model: RestTransactionContainer<AnticounterfeitRegisterProductTransaction>) {
        const builder = new RegisterProductBuilder();
        const transaction = builder
            .nonce(model.Nonce)
            .product(model.Asset.ProductId, model.Asset.Description, model.Asset.ManufacturerAddressId, model.Asset.Metadata)
            .vendorField(VENDOR_FIELD)
            .recipientId(model.Asset.ManufacturerAddressId);

        transaction.data.signature = model.Signature;
        transaction.data.senderPublicKey = model.SenderPublicKey;
        transaction.data.id = model.TransactionId;

        console.log(JSON.stringify(transaction.data));
        return await this.sendTransaction(transaction.data);
    }

    /** Retrieves all the registerd products */
    public async GetRegisteredProducts(): Promise<any> {
        return await this.connection.api('transactions').search(
            {
                typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
                type: REGISTER_PRODUCT_TYPE
            } as SearchTransactionsApiBody,
            { page: 1, limit: 100 } as ApiQuery);
    }

    /** Checks the account informations (the delegate must exist and must have the specified username) */
    public async LoginAccount(username: string, passphrase: string) : Promise<boolean> {
        const rootAddressId: string = Identities.Address.fromPassphrase(passphrase);
        const delegateResult = await this.connection.api('delegates').get(rootAddressId);
        return (delegateResult.body.data.username === username);
    }
}