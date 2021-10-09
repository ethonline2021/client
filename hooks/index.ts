import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { useState, useEffect, useContext } from 'react'

import { injected } from '../connectors'
import { useErrors } from '../providers'

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
