import { ethers } from 'ethers'
import { useState, useEffect, useContext } from 'react'
import { useWeb3React } from '@web3-react/core'

import ContractMain from "./contracts/contracts/Main.sol/Main.json"
import ItemContract from "./contracts/contracts/Item.sol/Item.json"

import { injected } from './connectors'
import { ContractsContext, IContractsContext, useErrors } from './providers'
import { parseItem } from './lib'

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
        let scMain : ethers.Contract
        try {
          scMain = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_MAIN, ContractMain.abi, signer)
        } catch (e) {
          console.error('error initializing main contract:', e)
        }

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

export const useItem = (account, address, library) => {
  const [item, setItem] = useState({
    title: '',
    description: '',
    amount: 0,
    owner: '',
    price: ethers.BigNumber.from(0)
  })
  const [itemContract, setItemContract] = useState<ethers.Contract>()
  const [loading, setLoading] = useState(false)

  // set item contract
  useEffect(() => {
    if (!itemContract && library && account) {
      setItemContract(new ethers.Contract(address, ItemContract.abi, library.getSigner(account)))
    }
  }, [account, address, itemContract, library])

  // fetch data
  useEffect(() => {
    ;(async () => {
      if (!loading && !item.title.length && itemContract) {
        setLoading(true)
        const itm = await itemContract.getDetails()
        setItem(parseItem(itm))
        setLoading(false)
      }
    })()
  }, [loading, item, itemContract])

  return {
    loading,
    item,
    itemContract,
  }
}
