import { ethers } from 'ethers'
import { useState, useEffect, useContext } from 'react'
import { useWeb3React } from '@web3-react/core'

import ContractMain from "./contracts/contracts/Main.sol/Main.json"

import { injected } from './connectors'
import { ContractsContext } from './providers'

export const useEagerConnect = () => {
  const { activate, active } = useWeb3React()

  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        setTried(true)
      }
    })
  }, [])

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

export function useContracts() {
  const {account, active, library, connector} = useWeb3React()
  const context = useContext(ContractsContext)
  const [main, setMain] = useState(null)
  const [signPending, setSignPending] = useState(false)

  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractsProvider')
  }

  // init contracts
  useEffect(async () => {
    if (active && !main) {
      const signer = await library.getSigner(account)
      const scMain = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_MAIN, ContractMain.abi, signer)

      setMain(scMain)
      setSignPending(true)
    }
  }, [active, main])

  return {
    main,
  }
}
