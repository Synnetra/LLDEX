import { ConnectionInfo } from '../models/connection-info';
import * as PubNub from "pubnub";


// export const WETH_DAI: ConnectionInfo = {
//   title: "WETH/DAI",
//   settings: {
//     channels: ['eth-usdt-1'],
//     withPresence: true
//   }
// }

// export const WETH_LLDEX: ConnectionInfo = {
//   title: "WETH/LLDEX",
//   settings: {
//     channels: ['btc-usdt-1'],
//     withPresence: true
//   }
// }


export const ONE_USDT: ConnectionInfo = {
  title: "WONE/1USDT",
  settings: {
    channels: ['one-usdt-10'],
    withPresence: true
  }
}

export const ONE_BTC: ConnectionInfo = {
  title: "WONE/1WBTC",
  settings: {
    channels: ['one-btc-10'],
    withPresence: true
  }
}


export const ETH_BTC: ConnectionInfo = {
  title: "1ETH/1WBTC",
  settings: {
    channels: ['eth-btc-10'],
    withPresence: true
  }
}

export const ETH_USDT: ConnectionInfo = {
  title: "1ETH/1USDT",
  settings: {
    channels: ['eth-usdt-10'],
    withPresence: true
  }
}


export const BTC_USDT: ConnectionInfo = {
  title: "1WBTC/1USDT",
  settings: {
    channels: ['btc-usdt-10'],
    withPresence: true
  }
}
