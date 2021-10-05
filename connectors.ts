import { InjectedConnector } from '@web3-react/injected-connector'
import {networkIds} from './networks'

export const injected = new InjectedConnector({
  supportedChainIds: networkIds(),
})
