import { AbiItem } from './model/abi.model';
import LimitOrderProtocolABISource from './abi/LimitOrderProtocol.json';
import ERC20ABISource from './abi/ERC20ABI.json';

export const PROTOCOL_NAME = '1inch Limit Order Protocol';

export const PROTOCOL_VERSION = '1';

export const ZX = '0x';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const CALL_RESULTS_PREFIX = 'CALL_RESULTS_';

export const LIMIT_ORDER_PROTOCOL_ABI: AbiItem[] = LimitOrderProtocolABISource;

export const ERC20_ABI: AbiItem[] = ERC20ABISource;

export const EIP712_DOMAIN = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

export const ORDER_STRUCTURE = [
    { name: 'salt', type: 'uint256' },
    { name: 'takerAsset', type: 'address' },
    { name: 'makerAsset', type: 'address' },
    { name: 'takerAssetData', type: 'bytes' },
    { name: 'makerAssetData', type: 'bytes' },
    { name: 'getTakerAmount', type: 'bytes' },
    { name: 'getMakerAmount', type: 'bytes' },
    { name: 'predicate', type: 'bytes' },
    { name: 'permit', type: 'bytes' },
    { name: 'interaction', type: 'bytes' },
];

export const RFQ_ORDER_STRUCTURE = [
    { name: 'info', type: 'uint256' },
    { name: 'feeAmount', type: 'uint256' },
    { name: 'takerAsset', type: 'address' },
    { name: 'makerAsset', type: 'address' },
    { name: 'feeTokenAddress', type: 'address' },
    { name: 'frontendAddress', type: 'address' },
    { name: 'takerAssetData', type: 'bytes' },
    { name: 'makerAssetData', type: 'bytes' },
];
