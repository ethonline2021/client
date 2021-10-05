import { useWeb3React } from "@web3-react/core"
import { ethers } from "ethers"
import { useContext, useEffect, useState } from "react"

import ContractMain from "../contracts/contracts/Main.sol/Main.json"
import networks from "../networks"
import { ContractsContext } from "../providers"

export const useContracts = () : IContractsContext => {
  const context = useContext(ContractsContext)
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractsProvider')
  }

  const {account, active, library, connector, chainId} = useWeb3React()
  const [main, setMain] = useState(null)
  const [configuredChainId, setConfiguredChainId] = useState<number | undefined>()

  // init contracts
  useEffect(() => {
    ;(async () => {
      if (active && !main && chainId && chainId !== configuredChainId) {
        const signer = await library.getSigner(account)
        let scMain : ethers.Contract
        try {
          scMain = new ethers.Contract(networks[chainId].main, ContractMain.abi, signer)
        } catch (e) {
          console.error('error initializing main contract:', e)
        }

        context.setSigner(signer)
        setMain(scMain)
        setConfiguredChainId(chainId)
      }
    })()
  }, [active, account, library, main, context, configuredChainId, chainId])

  return {
    ...context,
    main,
    chainId: configuredChainId,
  }
}
