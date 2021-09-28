import { InjectedConnector } from '@web3-react/injected-connector'

export const injected = new InjectedConnector({
  supportedChainIds: [
    4, // polygon
    80001, // mumbai
    31337, // hardhat
  ],
})
