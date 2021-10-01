import { ethers } from 'ethers'
import { useState, useEffect, useContext } from 'react'
import { useWeb3React } from '@web3-react/core'

import ContractMain from "./contracts/contracts/Main.sol/Main.json"

import { injected } from './connectors'
import { ContractsContext, IContractsContext, useErrors } from './providers'

export const useEagerConnect = () => {
  const { activate, active } = useWeb3React()
  const {setError, error} = useErrors()

  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(injected, (err) => {
          if (err.message !== error) {
            setError(err.message)
          }
        }, true).catch(() => {
          setTried(true)
        })
      } else {
        setTried(true)
      }
    })
  }, [activate, error, setError])

  useEffect(() => {
    if (!tried && active) {
      setTried(true)
    }
  }, [tried, active])

  return tried
}

const methods = {
  isSignedUp: () => {},
  signUp: () => {},
}

export const useContracts = () : IContractsContext => {
  const context = useContext(ContractsContext)
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractsProvider')
  }

  const {account, active, library, connector} = useWeb3React()
  const [main, setMain] = useState(null)

  // init contracts
  useEffect(() => {
    ;(async () => {
      if (active && !main) {
        const signer = await library.getSigner(account)
        const scMain = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_MAIN, ContractMain.abi, signer)

        context.setSigner(signer)
        setMain(scMain)
      }
    })()
  }, [active, account, library, main, context])

  return {
    ...context,
    main,
  }
}
