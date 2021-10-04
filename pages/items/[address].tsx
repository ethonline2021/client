import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Button, PageHeader } from "antd"
import { ethers, Contract } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Else, If, Then } from "react-if"

import ItemContract from "../../contracts/contracts/Item.sol/Item.json"
import Loading from "../../components/Loading"
import { useContracts, useItem } from "../../hooks"
import { decimal, parseItem } from "../../lib"
import { Content } from "antd/lib/layout/layout"

const SuperfluidSDK = require("@superfluid-finance/js-sdk")

const ItemsView = () => {
  const router = useRouter()
  const [ realBalance, setRealBalance ] = useState(ethers.BigNumber.from(0))
  const [ price, setPrice ] = useState(0)
  const [ block, setBlock ] = useState(0)
  const [ updating, setUpdating ] = useState(false)
  const [ contentLoading, setContentLoading ] = useState(false)
  const { deployed } = useContracts()
  const { address } = router.query
  const { account, library } = useWeb3React()
  const [ buying, setBuying ] = useState(false)
  const [ flow, setFlow ] = useState<{
    timestamp: Date
    flowRate: string
    deposit: string
    owedDeposit: string
  }>()
  const [ superfluid, setSuperfluid ] = useState<any>()
  const [ decimals, setDecimals ] = useState(0)
  const [ tokenContract, setTokenContract ] = useState<Contract | null>()
  const [ superTokenContract, setSuperTokenContract ] = useState<Contract | null>()
  const { item, loading, itemContract } = useItem(account, address, library)

  // init sf, flow & tokens
  useEffect(() => {
    ;(async () => {
      if (!superfluid && library && item && item.owner.length && item.owner !== account) {
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

        try {
          const flow = await sf.cfa?.getFlow({
            receiver: address,
            sender: account,
            superToken: superToken.address,
          })
          setFlow(flow)
        } catch (e) {
          console.error('error grabbing user flow:', e)
        }
      }
    })()
  }, [account, address, library, item, superfluid])

  // grab & set decimals
  useEffect(() => {
    ;(async () => {
      if (!decimals && superTokenContract) {
        try {
          const dec = await superTokenContract.decimals()
          setDecimals(dec)
        } catch (e) {
          console.error('error grabbing decimals')
        }
      }
    })()
  }, [decimals, superTokenContract])

  // grab & set balance
  useEffect(() => {
    (async () => {
      if (superTokenContract && !updating && realBalance.isZero() && address && item.owner === account) {
        setUpdating(true)
        try {
          setRealBalance(await superTokenContract.balanceOf(address))
          setContentLoading(false)
        } catch (e) {
          console.error('error grabbing balance:', e)
          setUpdating(false)
        }
      }
    })()
  }, [address, block, superTokenContract, realBalance, updating, account, item])

  // grab & set price
  useEffect(() => {
    ;(async () => {
      if (!price && decimals && item) {
        setPrice(item.price / Math.pow(10, decimals))
      }
    })();
  }, [price, decimals, item])

  // block update event updating balance
  useEffect(() => {
    if (library && !library._events.length && superTokenContract) {
      library.on('block', async (bh: any) => {
        setBlock(bh)
        if (updating) {
          return false
        }

        setUpdating(true)
        setRealBalance(await superTokenContract.balanceOf(address))
        setUpdating(false)
      })
    }

    return () => {
      if (library && library._events.length) {
        library.removeAllListeners('block')
      }
    }
  }, [account, address, block, superTokenContract, library, updating])

  const purchase = async () => {
    if (!superfluid || !superTokenContract || !tokenContract) {
      console.error('superfluid not yet initialized')
      return false
    }

    setBuying(true)

    // check for balance & top-up
    if (Number(await superTokenContract.balanceOf(account)) < Number(item.price)) {
      console.log('account does not have enough balance')
      // this should be only with superfluid test tokens
      if (Number(await tokenContract.balanceOf(account)) < Number(item.price)) {
        const mint = await tokenContract.mint(account, ethers.utils.parseEther("1000"))
        // wait for tx
        await mint.wait()
      }

      // approve
      if (Number(await tokenContract.allowance(account, superTokenContract.address)) < Number(item.price)) {
        const approve = await tokenContract.approve(superTokenContract.address, ethers.BigNumber.from(item.price))
        await approve.wait()
      }

      try {
        // wrap
        const wrap = await superTokenContract.upgrade(ethers.BigNumber.from(item.price))
        await wrap.wait()
      } catch (e) {
        console.error('wrap failed:', e)
      }
    }

    const buyer = superfluid.user({
      address: account,
      token: superTokenContract.address,
    })
    const flowRate = Math.floor(Number(item.price) / (3600 * 24 * 30))

    const flow = {
      recipient: address,
      flowRate: flowRate.toString(),
    }
    await buyer.flow(flow)

    setBuying(false)
    setFlow(flow)
  }

  const cancel = async () => {
    if (!superfluid || !superTokenContract || !tokenContract) {
      console.error('superfluid not yet initialized')
      return false
    }

    setBuying(true)

    const buyer = superfluid.user({
      address: account,
      token: superTokenContract.address,
    })

    const flow = {
      recipient: address,
      flowRate: "0",
    }
    await buyer.flow(flow)

    setFlow(flow)
    setBuying(false)
  }

  return (
    <div>
      <Loading loading={loading}>
        <PageHeader
          title={item.title}
          onBack={() => history.back()}
        >
          <Content>
            <p>{item.description}</p>
            <If condition={Boolean(deployed)}>
              <If condition={item.owner?.toLowerCase() === account?.toLowerCase()}>
                <Then>
                  <p>
                    Current income: {contentLoading ? 'loading..' : decimal(realBalance, decimals)}
                  </p>
                </Then>
                <Else>
                  <If condition={flow?.flowRate === "0"}>
                    <Then>
                      <Button
                        disabled={price === 0 || buying}
                        loading={buying}
                        onClick={purchase}
                      >
                        Buy one for {price}
                      </Button>
                    </Then>
                    <Else>
                      <If condition={Number(flow?.flowRate) > 0}>
                        <p>
                          You&apos;re already paying for it, payment flowrate/s: {flow && flow.flowRate && decimal(flow.flowRate, decimals)}
                        </p>
                        <p>
                          <Button
                            onClick={cancel}
                            loading={buying}
                            disabled={buying}
                          >
                            Cancel assistance
                          </Button>
                        </p>
                      </If>
                    </Else>
                  </If>
                </Else>
              </If>
            </If>
          </Content>
        </PageHeader>
      </Loading>
    </div>
  )
}

export default ItemsView
