import {
    EIP712_DOMAIN,
    ORDER_STRUCTURE,
    PROTOCOL_VERSION,
    ZERO_ADDRESS,
    PROTOCOL_NAME,
    LIMIT_ORDER_PROTOCOL_ABI,
    ZX,
    RFQ_ORDER_STRUCTURE,
} from './limit-order-protocol.const';
import {
    ChainId,
    LimitOrder,
    LimitOrderProtocolMethods,
    LimitOrderData,
    LimitOrderHash,
    LimitOrderSignature,
    RFQOrder,
    RFQOrderData,
} from './model/limit-order-protocol.model';
import { EIP712TypedData, MessageTypes } from './model/eip712.model';
import { TypedDataUtils, TypedMessage } from 'eth-sig-util';
import { ProviderConnector } from './connector/provider.connector';
import { Erc20Facade } from './erc20.facade';

export function generateOrderSalt(): string {
    return Math.round(Math.random() * Date.now()) + '';
}

export function generateRFQOrderInfo(
    id: number,
    expiresInTimestamp: number
): string {
    return ((BigInt(expiresInTimestamp) << BigInt(64)) | BigInt(id)).toString(
        10
    );
}

export class LimitOrderBuilder {
    private readonly erc20Facade: Erc20Facade;

    constructor(
        private readonly contractAddress: string,
        private readonly chainId: ChainId,
        private readonly providerConnector: ProviderConnector,
        private readonly generateSalt = generateOrderSalt
    ) {
        this.erc20Facade = new Erc20Facade(this.providerConnector);
    }

    buildOrderSignature(
        walletAddress: string,
        typedData: EIP712TypedData
    ): Promise<LimitOrderSignature> {
        const dataHash = TypedDataUtils.hashStruct(
            typedData.primaryType,
            typedData.message,
            typedData.types,
            true
        ).toString('hex');

        return this.providerConnector.signTypedData(
            walletAddress,
            typedData,
            dataHash
        );
    }

    buildLimitOrderHash(orderTypedData: EIP712TypedData): LimitOrderHash {
        const message = orderTypedData as TypedMessage<MessageTypes>;

        return ZX + TypedDataUtils.sign(message).toString('hex');
    }

    buildLimitOrderTypedData(order: LimitOrder): EIP712TypedData {
        return {
            primaryType: 'Order',
            types: {
                EIP712Domain: EIP712_DOMAIN,
                Order: ORDER_STRUCTURE,
            },
            domain: {
                name: PROTOCOL_NAME,
                version: PROTOCOL_VERSION,
                chainId: this.chainId,
                verifyingContract: this.contractAddress,
            },
            message: order,
        };
    }

    buildRFQOrderTypedData(order: RFQOrder): EIP712TypedData {
        return {
            primaryType: 'OrderRFQ',
            types: {
                EIP712Domain: EIP712_DOMAIN,
                OrderRFQ: RFQ_ORDER_STRUCTURE,
            },
            domain: {
                name: PROTOCOL_NAME,
                version: PROTOCOL_VERSION,
                chainId: this.chainId,
                verifyingContract: this.contractAddress,
            },
            message: order,
        };
    }

    /* eslint-disable max-lines-per-function */
    buildRFQOrder({
        id,
        expiresInTimestamp,
        takerAssetAddress,
        makerAssetAddress,
        takerAddress,
        makerAddress = ZERO_ADDRESS,
        takerAmount,
        makerAmount,
        feeAmount,
        feeTokenAddress,
        frontendAddress,
    }: RFQOrderData): RFQOrder {
        return {
            info: generateRFQOrderInfo(id, expiresInTimestamp),
            feeAmount: feeAmount,
            takerAsset: takerAssetAddress,
            makerAsset: makerAssetAddress,
            feeTokenAddress: feeTokenAddress,
            frontendAddress: frontendAddress,
            takerAssetData: this.erc20Facade.transferFrom(
                null,
                takerAddress,
                makerAddress,
                takerAmount
            ),
            makerAssetData: this.erc20Facade.transferFrom(
                null,
                makerAddress,
                takerAddress,
                makerAmount
            ),

        };
    }
    /* eslint-enable max-lines-per-function */

    /* eslint-disable max-lines-per-function */
    buildLimitOrder({
        takerAssetAddress,
        makerAssetAddress,
        takerAddress,
        makerAddress = ZERO_ADDRESS,
        takerAmount,
        makerAmount,
        predicate = ZX,
        permit = ZX,
        interaction = ZX,
    }: LimitOrderData): LimitOrder {
        return {
            salt: this.generateSalt(),
            takerAsset: takerAssetAddress,
            makerAsset: makerAssetAddress,
            takerAssetData: this.erc20Facade.transferFrom(
                null,
                takerAddress,
                makerAddress,
                takerAmount
            ),
            makerAssetData: this.erc20Facade.transferFrom(
                null,
                makerAddress,
                takerAddress,
                makerAmount
            ),
            getTakerAmount: this.getAmountData(
                LimitOrderProtocolMethods.getTakerAmount,
                takerAmount,
                makerAmount
            ),
            getMakerAmount: this.getAmountData(
                LimitOrderProtocolMethods.getMakerAmount,
                takerAmount,
                makerAmount
            ),
            predicate,
            permit,
            interaction,
        };
    }
    /* eslint-enable max-lines-per-function */

    // Get nonce from contract (nonce method) and put it to predicate on order creating
    private getAmountData(
        methodName: LimitOrderProtocolMethods,
        takerAmount: string,
        makerAmount: string,
        swapMakerAmount = '0'
    ): string {
        return this.getContractCallData(methodName, [
            takerAmount,
            makerAmount,
            swapMakerAmount,
        ]).substr(0, 2 + 68 * 2);
    }

    private getContractCallData(
        methodName: LimitOrderProtocolMethods,
        methodParams: unknown[] = []
    ): string {
        return this.providerConnector.contractEncodeABI(
            LIMIT_ORDER_PROTOCOL_ABI,
            this.contractAddress,
            methodName,
            methodParams
        );
    }
}
