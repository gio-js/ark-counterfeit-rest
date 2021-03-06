import { Connection, SearchTransactionsApiBody, ApiQuery } from '@arkecosystem/client'
import { Identities, Managers, Transactions } from '@arkecosystem/crypto'
import {
    RegisterManufacturerBuilder,
    RegisterManufacturerTransaction,
    RegisterProductTransaction,
    AnticounterfeitRegisterProductTransaction,
    RegisterProductBuilder,
    AnticounterfeitTransferProductTransaction,
    TransferProductBuilder,
    AnticounterfeitReceiveProductTransaction,
    ReceiveProductBuilder
} from 'common/ark-counterfeit-common';
import { BigNumber } from '@arkecosystem/crypto/dist/utils';
import { generateMnemonic } from 'bip39';
import {
    ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
    REGISTER_PRODUCT_TYPE,
    REGISTER_MANUFACTURER_TYPE, VENDOR_FIELD, RECEIVE_PRODUCT_TYPE
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
        return (parseInt(nonce, 10) + 1)
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
            .nonce(rootNonce.toString())
            .vendorField(this.vendorField)
            .amount('5000000000')
            .recipientId(manufacturerAddressId)
            .sign(rootPassphrase)
            .getStruct();

        const transferResult = await this.sendTransaction(transactionTransfer);
        if (transferResult.body.errors) {
            return transferResult;
        }

        // Wait for at least one block (+5 sec) to have balance saved
        await this.delay(8000);

        const builder = new RegisterManufacturerBuilder();
        const transaction = builder
            .nonce((rootNonce + 1).toString())
            .manufacturer(prefixId, companyName, fiscalCode, registrationContract)
            .vendorField(this.vendorField)
            .recipientId(manufacturerAddressId)
            .sign(rootPassphrase)
            .getStruct();

        return await this.sendTransaction(transaction);
    }

    /** Retrieves all the registerd manufacturers */
    public async GetRegisteredManufacturers(fiscalCode: string = ""): Promise<any> {
        const filter = {
            typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
            type: REGISTER_MANUFACTURER_TYPE
        } as SearchTransactionsApiBody;

        if (fiscalCode) {
            filter.asset = { AnticounterfeitRegisterManufacturerTransaction: { CompanyFiscalCode: fiscalCode } };
        }
        return await this.connection.api('transactions').search(
            filter,
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
            .nonce(rootNonce.toString())
            .vendorField(this.vendorField)
            .amount('5000000000')
            .recipientId(newAccountAddressId)
            .sign(rootPassphrase)
            .getStruct();

        const transferResult = await this.sendTransaction(transactionTransfer);
        if (transferResult.body.errors) {
            return transferResult;
        }

        // Wait for at least one block (+5 sec) to have balance saved
        await this.delay(8000);

        const delegateNonce = await this.getNextNonce(newAccountAddressId);
        const transactionDelegate = Transactions.BuilderFactory
            .delegateRegistration()
            .usernameAsset(userName)
            .nonce(delegateNonce.toString())
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

    /** Create a new transfer product transaction */
    public async TransferProduct(model: RestTransactionContainer<AnticounterfeitTransferProductTransaction>) {
        const builder = new TransferProductBuilder();
        const transaction = builder
            .nonce(model.Nonce)
            .product(model.Asset.ProductId, model.Asset.SenderAddressId, model.Asset.RecipientAddressId)
            .vendorField(VENDOR_FIELD)
            .recipientId(model.Asset.RecipientAddressId);

        transaction.data.signature = model.Signature;
        transaction.data.senderPublicKey = model.SenderPublicKey;
        transaction.data.id = model.TransactionId;

        console.log(JSON.stringify(transaction.data));
        return await this.sendTransaction(transaction.data);
    }

    /** Create a new receive product transaction */
    public async ReceiveProduct(model: RestTransactionContainer<AnticounterfeitReceiveProductTransaction>) {
        const builder = new ReceiveProductBuilder();
        const transaction = builder
            .nonce(model.Nonce)
            .product(model.Asset.ProductId, model.Asset.RecipientAddressId)
            .vendorField(VENDOR_FIELD)
            .recipientId(model.Asset.RecipientAddressId);

        transaction.data.signature = model.Signature;
        transaction.data.senderPublicKey = model.SenderPublicKey;
        transaction.data.id = model.TransactionId;

        console.log(JSON.stringify(transaction.data));
        return await this.sendTransaction(transaction.data);
    }

    /** Retrieves all the registerd products */
    public async GetRegisteredProducts(manufacturerAddressId: string, productId: string): Promise<any> {
        const filter: SearchTransactionsApiBody = {
            typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
            type: REGISTER_PRODUCT_TYPE
        };

        if (productId) {
            filter.asset = { AnticounterfeitRegisterProductTransaction: { ProductId: productId } };
        }

        if (manufacturerAddressId) {
            filter.recipientId = manufacturerAddressId;
        }

        return await this.connection.api('transactions').search(filter,
            { page: 1, limit: 100 } as ApiQuery);
    }

    /** Retrieves all the registerd products */
    public async RetrieveProductOwner(productId: string): Promise<any> {
        const filterManufacturer: SearchTransactionsApiBody = {
            typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
            type: REGISTER_PRODUCT_TYPE,
            asset: { AnticounterfeitRegisterProductTransaction: { ProductId: productId } }
        };

        const filterReceiver: SearchTransactionsApiBody = {
            typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
            type: RECEIVE_PRODUCT_TYPE,
            asset: { AnticounterfeitReceiveProductTransaction: { ProductId: productId } }
        };


        const receiverResult = await this.connection.api('transactions').search(filterReceiver,
            { page: 1, limit: 100 } as ApiQuery);
        if (receiverResult.body.data &&
            receiverResult.body.data.length) {
            return receiverResult.body.data[0].recipient;
        }

        const manufacturerResult = await this.connection.api('transactions').search(filterManufacturer,
            { page: 1, limit: 100 } as ApiQuery);
        if (manufacturerResult.body.data &&
            manufacturerResult.body.data.length) {
            return manufacturerResult.body.data[0].recipient;
        }
    }

    /** Retrieves all the registerd products on a specific owner */
    public async RetrieveProductsByOwner(addressId: string): Promise<any> {
        const filterReceiver: SearchTransactionsApiBody = {
            typeGroup: ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP,
            type: RECEIVE_PRODUCT_TYPE,
            asset: { AnticounterfeitReceiveProductTransaction: { RecipientAddressId: addressId } }
        };

        const ownedElements = [];
        const receiverResult = await this.connection.api('transactions').search(filterReceiver,
            { page: 1, limit: 100 } as ApiQuery);
        if (receiverResult.body.data &&
            receiverResult.body.data.length) {
            const receivedElements = receiverResult.body.data;

            for (let receivedElement of receivedElements) {

                let currentOwner = await this.RetrieveProductOwner(receivedElement.asset!.AnticounterfeitReceiveProductTransaction.ProductId);
                if (currentOwner == addressId) {
                    const registeredProduct = await this.GetRegisteredProducts(null, receivedElement.asset!.AnticounterfeitReceiveProductTransaction.ProductId);
                    ownedElements.push(registeredProduct.body.data[0].asset.AnticounterfeitRegisterProductTransaction);
                }

            }
        }

        return { body: { data: ownedElements } };
    }

    /** Checks the account informations (the delegate must exist and must have the specified username) */
    public async LoginAccount(username: string, addressId: string): Promise<boolean> {
        try {
            const delegateResult = await this.connection.api('delegates').get(addressId);
            if (delegateResult.body.data.username === username) {
                return true;
            }
        } catch (ex) { }

        const manufacturerResult = await this.GetRegisteredManufacturers(username);
        if (manufacturerResult.body.data &&
            manufacturerResult.body.data.length &&
            manufacturerResult.body.data[0].recipient === addressId) {
            return true;
        }

        return false;
    }

    /** Retrieve current blockchain height */
    public async GetBlockchainHeight(): Promise<any> {
        const result = await this.connection.get('blockchain');
        if (result.body.errors) {
            return result;
        }

        return result.body.data.block.height;
    }
}