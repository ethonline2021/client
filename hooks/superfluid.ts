import SuperfluidSDK from "@superfluid-finance/js-sdk"
import { ethers } from "ethers"
import { useState } from "react"

export const useSuperfluid = (library) => {
  const [ superfluid, setSuperfluid ] = useState<any>()
  const [ tokenContract, setTokenContract ] = useState<Contract | null>()
  const [ superTokenContract, setSuperTokenContract ] = useState<Contract | null>()

  // init sf, flow & tokens
  useEffect(() => {
    ;(async () => {
      if (!superfluid && library) {
        const sfVersion = "v1"
        const tokenSymbol = "fDAI"

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
