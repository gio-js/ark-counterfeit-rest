export class RestTransactionContainer<T> {

    /**
     * Generic element container for business data
     */
    Asset: T;

    /** 
     * Sender public key
     */
    Nonce: number;

    /** 
     * Sender public key
     */
    SenderPublicKey: string;

    /** 
     * Ark.io transaction @id
     */
    TransactionId: string;

    /** 
     * Ark.io transaction signature
     */
    Signature: string;

}