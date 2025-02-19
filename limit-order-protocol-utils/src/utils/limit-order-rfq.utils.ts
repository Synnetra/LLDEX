#!/usr/bin/env node

import prompts from 'prompts';
import yargs from 'yargs';
import kleur from 'kleur';
import Web3 from 'web3';
import { LimitOrderBuilder } from '../limit-order.builder';
import { RFQOrder } from '../model/limit-order-protocol.model';
import { LimitOrderProtocolFacade } from '../limit-order-protocol.facade';
import {
    cancelOrderSchema,
    contractAddresses,
    createOrderSchema,
    explorersUrls,
    fillOrderSchema,
    operationSchema,
    rpcUrls,
} from './limit-order-rfq.const';
import {
    CancelingParams,
    CreatingParams,
    FillingParams,
    OperationParams,
} from './limit-order-rfq.model';
import { TransactionConfig } from 'web3-core';
import { PrivateKeyProviderConnector } from '../connector/private-key-provider.connector';

const allSchemas = [
    cancelOrderSchema,
    createOrderSchema,
    fillOrderSchema,
    operationSchema,
];

(async () => {
    const argvKeys = Object.keys(yargs.argv);
    const isRunningWithArgv = allSchemas.some((schema) => {
        return schema
            .map((i) => i.name as string)
            .every((param) => argvKeys.includes(param));
    });

    prompts.override(yargs.argv);

    const operationResult = (await prompts(operationSchema)) as OperationParams;

    switch (operationResult.operation) {
        case 'create':
            await createOrderOperation(isRunningWithArgv);
            break;
        case 'fill':
            await fillOrderOperation(isRunningWithArgv);
            break;
        case 'cancel':
            await cancelOrderOperation(isRunningWithArgv);
            break;
        default:
            console.log('Unknown operation: ', operationResult.operation);
            break;
    }
})();

async function createOrderOperation(isRunningWithArgv: boolean) {
    const creatingParams = (await prompts(createOrderSchema)) as CreatingParams;

    const newOrder = createOrder(creatingParams);

    if (isRunningWithArgv) {
        console.log(JSON.stringify(newOrder));
        return;
    }

    console.log(kleur.green().bold('New limit order RFQ: '));
    console.log(kleur.white().underline(JSON.stringify(newOrder, null, 4)));
}

async function fillOrderOperation(isRunningWithArgv: boolean) {
    const fillingParams = (await prompts(fillOrderSchema)) as FillingParams;
    const orderForFill: RFQOrder = JSON.parse(fillingParams.order);

    console.log(kleur.green().bold('Order for filling: '));
    console.log(kleur.white().underline(JSON.stringify(orderForFill, null, 4)));

    const txHash = await fillOrder(fillingParams, orderForFill);

    if (isRunningWithArgv) {
        console.log(txHash);
        return;
    }

    console.log(kleur.green().bold('Order filling transaction: '));
    printTransactionLink(explorerTxLink(fillingParams.chainId, txHash));
}

async function cancelOrderOperation(isRunningWithArgv: boolean) {
    const cancelingParams = (await prompts(
        cancelOrderSchema
    )) as CancelingParams;

    const cancelingTxHash = await cancelOrder(cancelingParams);

    if (isRunningWithArgv) {
        console.log(cancelingTxHash);
        return;
    }

    console.log(kleur.green().bold('Order canceling transaction: '));
    printTransactionLink(
        explorerTxLink(cancelingParams.chainId, cancelingTxHash)
    );
}

/* eslint-disable max-lines-per-function */
function createOrder(params: CreatingParams): RFQOrder {
    const contractAddress = contractAddresses[params.chainId];
    const web3 = new Web3(rpcUrls[params.chainId]);
    const providerConnector = new PrivateKeyProviderConnector(
        params.privateKey,
        web3
    );
    const walletAddress = web3.eth.accounts.privateKeyToAccount(
        params.privateKey
    ).address;

    const limitOrderBuilder = new LimitOrderBuilder(
        contractAddress,
        params.chainId,
        providerConnector
    );

    return limitOrderBuilder.buildRFQOrder({
        id: params.orderId,
        expiresInTimestamp: Math.ceil(Date.now() / 1000) + params.expiresIn,
        takerAddress: walletAddress,
        takerAssetAddress: params.takerAssetAddress,
        makerAssetAddress: params.makerAssetAddress,
        takerAmount: params.takerAmount,
        makerAmount: params.makerAmount,
        makerAddress: params.makerAddress || undefined,
        feeAmount: params.feeAmount,
        feeTokenAddress: params.feeTokenAddress,
        frontendAddress: params.frontendAddress,
    });
}
/* eslint-enable max-lines-per-function */

/* eslint-disable max-lines-per-function */
async function fillOrder(
    params: FillingParams,
    order: RFQOrder
): Promise<string> {
    const contractAddress = contractAddresses[params.chainId];
    const web3 = new Web3(rpcUrls[params.chainId]);
    const providerConnector = new PrivateKeyProviderConnector(
        params.privateKey,
        web3
    );
    const walletAddress = web3.eth.accounts.privateKeyToAccount(
        params.privateKey
    ).address;

    const limitOrderBuilder = new LimitOrderBuilder(
        contractAddress,
        params.chainId,
        providerConnector
    );
    const limitOrderProtocolFacade = new LimitOrderProtocolFacade(
        contractAddress,
        providerConnector
    );

    const typedData = limitOrderBuilder.buildRFQOrderTypedData(order);
    const signature = await limitOrderBuilder.buildOrderSignature(
        walletAddress,
        typedData
    );

    const callData = limitOrderProtocolFacade.fillRFQOrder(
        order,
        signature,
        params.takerAmount,
        params.makerAmount
    );

    const txConfig: TransactionConfig = {
        to: contractAddress,
        from: walletAddress,
        data: callData,
        value: '0',
        gas: 120_000,
        gasPrice: gweiToWei(params.gasPrice),
        nonce: await web3.eth.getTransactionCount(walletAddress),
    };

    return sendSignedTransaction(web3, txConfig, params.privateKey);
}
/* eslint-enable max-lines-per-function */

/* eslint-disable max-lines-per-function */
async function cancelOrder(params: CancelingParams): Promise<string> {
    const contractAddress = contractAddresses[params.chainId];
    const web3 = new Web3(
        new Web3.providers.HttpProvider(rpcUrls[params.chainId])
    );
    const providerConnector = new PrivateKeyProviderConnector(
        params.privateKey,
        web3
    );
    const walletAddress = web3.eth.accounts.privateKeyToAccount(
        params.privateKey
    ).address;

    const limitOrderProtocolFacade = new LimitOrderProtocolFacade(
        contractAddress,
        providerConnector
    );

    const callData = limitOrderProtocolFacade.cancelRFQOrder(params.orderInfo);
    const txConfig: TransactionConfig = {
        to: contractAddress,
        from: walletAddress,
        data: callData,
        value: '0',
        gas: 50_000,
        gasPrice: gweiToWei(params.gasPrice),
        nonce: await web3.eth.getTransactionCount(walletAddress),
    };

    return sendSignedTransaction(web3, txConfig, params.privateKey);
}
/* eslint-enable max-lines-per-function */

async function sendSignedTransaction(
    web3: Web3,
    txConfig: TransactionConfig,
    privateKey: string
): Promise<string> {
    const sign = await web3.eth.accounts.signTransaction(txConfig, privateKey);

    return await new Promise<string>((resolve, reject) => {
        web3.eth.sendSignedTransaction(
            sign.rawTransaction as string,
            (error, hash) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(hash);
            }
        );
    });
}

function explorerTxLink(chainId: number, txHash: string): string {
    const explorerUrl = explorersUrls[chainId];

    return `${explorerUrl}/tx/${txHash}`;
}

function gweiToWei(value: number): string {
    return value + '000000000';
}

function printTransactionLink(text: string): void {
    console.log(
        kleur.white('************************************************')
    );
    console.log(kleur.white('   '));
    console.log(kleur.white().underline(text));
    console.log(kleur.white('   '));
    console.log(
        kleur.white('************************************************')
    );
}
