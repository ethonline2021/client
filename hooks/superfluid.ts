import { useQuery, gql } from "@apollo/client"
import SuperfluidSDK from "@superfluid-finance/js-sdk"
import { useWeb3React } from "@web3-react/core"
import { ethers } from "ethers"
import { useEffect, useState } from "react"

export const useSuperfluid = (library) => {
  const [ superfluid, setSuperfluid ] = useState<any>()
  const [ tokenContract, setTokenContract ] = useState<Contract | null>()
  const [ superTokenContract, setSuperTokenContract ] = useState<Contract | null>()

  // init sf, flow & tokens
  useEffect(() => {
    ;(async () => {
      if (!superfluid && library) {
        const sfVersion = "v1"
        const tokenSymbol = process.env.NEXT_PUBLIC_PAY_TOKEN_SYMBOL

        let sf
        try {
          sf = new SuperfluidSDK.Framework({
            ethers: library,
            tokens: [tokenSymbol],
          })

          await sf.initialize()
          setSuperfluid(sf)
        } catch (e) {
          console.error('error initializing superfluid:', e)
        }

        let token : ethers.Contract,
            superToken : ethers.Contract

        try {
          const {
            ISuperToken,
            TestToken,
          } = sf.contracts

          const tokenAddress = await sf.resolver.get(`tokens.${tokenSymbol}`)
          const superTokenAddress = await sf.resolver.get(`supertokens.${sfVersion}.${tokenSymbol}x`)

          token = await TestToken.at(tokenAddress)
          superToken = await ISuperToken.at(superTokenAddress)

          setTokenContract(token)
          setSuperTokenContract(superToken)
        } catch (e) {
          console.error('error getting token & supertoken info from sf:', e)
        }
      }
    })()
  }, [library, superfluid])

  return {
    superfluid,
    tokenContract,
    superTokenContract,
  }
}


export const useFlow = (receiver: string) => {
  const [ loading, setLoading ] = useState<boolean>(false)
  const [ flow, setFlow ] = useState<{
    timestamp: Date
    flowRate: string
    deposit: string
    owedDeposit: string
  } | undefined>()
  const { account, library } = useWeb3React()
  const { superfluid, superTokenContract } = useSuperfluid(library)

  useEffect(() => {
    ;(async () => {
      if (superfluid && account && receiver && superTokenContract && !flow && !loading) {
        setLoading(true)
        try {
          const flow = await superfluid.cfa.getFlow({
            receiver,
            sender: account,
            superToken: superTokenContract.address,
          })
          setFlow(flow)
        } catch (e) {
          console.error('error grabbing user flow:', e)
        }
        setLoading(false)
      }
    })()
  }, [flow, superfluid, account, receiver, superTokenContract, loading])

  return {
    flow,
    setFlow,
  }
}

export const useGraphFlow = (receiver: string) => {
  const { account } = useWeb3React()
  const FLOWS_LIST = gql`
    {
      purchaseFlows(where: {buyer: "${account}"}) {
        buyer
        item {
          id
        }
        status
        nftId
        flowRate
      }
    }
  `
  const {loading, data: queryData, error} = useQuery(FLOWS_LIST, {
    pollInterval: 5000,
  })
  const [flow, setFlow] = useState({
    flowRate: '0',
    status: 'not-initialized',
  })

  useEffect(() => {
    let current = {}
    if (queryData && !error && !loading) {
      current = queryData.purchaseFlows.find(({item: {id}}) => id === receiver)
    }
    if (receiver && !loading && !flow || (flow && flow.status && flow?.status !== current?.status)) {
      setFlow(current)
    }
  }, [receiver, loading, error, queryData, flow])

  return {
    loading,
    error,
    flow,
    setFlow,
  }
}
