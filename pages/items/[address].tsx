import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Button } from "antd"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Else, If, Then } from "react-if"
import SuperfluidSDK from "@superfluid-finance/js-sdk"

import Loading from "../../components/Loading"
import { useContracts } from "../../hooks"

const ItemsView = () => {
  const router = useRouter()
  const [ realBalance, setRealBalance ] = useState(ethers.BigNumber.from(0))
  const [ price, setPrice ] = useState(0)
  const [ block, setBlock ] = useState(0)
  const [ updating, setUpdating ] = useState(false)
  const [ contentLoading, setContentLoading ] = useState()
  const {deployed} = useContracts()
  const { address } = router.query
  const { account, library } = useWeb3React()
  const [ buying, setBuying ] = useState(false)
  const [ flow, setFlow ] = useState<{
    timestamp: Date
    flowRate: string
    deposit: string
    owedDeposit: string
  }>()
  const [ outcome, setOutcome ] = useState(0)
  const [ superfluid, setSuperfluid ] = useState()
  const [ decimals, setDecimals ] = useState(0)
  const [ tokenContract, setTokenContract ] = useState()
  const [ superTokenContract, setSuperTokenContract ] = useState()

  const ITEM_DETAILS = gql`
    {
      items(where: {id: "${address}"}) {
        owner
        id
        title
        description
        price
        amount
      }
    }
  `
  const { loading, error, data } = useQuery(ITEM_DETAILS)

  const decimal = (num: ethers.BigNumber, dec: number) =>
    Number(num.toString()) / Math.pow(10, dec)

  let item = {
    title: '',
    description: '',
    amount: 0,
    owner: '',
  }

  if (!loading && data && !item.title.length) {
    ([item] = data.items)
  }

  // init sf, flow & tokens
  useEffect(() => {
    ;(async () => {
      if (!superfluid && library && item && item.owner.length && item.owner !== account) {
        const sfVersion = "v1"
        const tokenSymbol = "fDAI"

        let sf : SuperfluidSDK.Framework
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
          console.error('error grabbing decimals:', dec)
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
      if (!price && decimals && data) {
        const p = data.items[0].price
        setPrice(p / Math.pow(10, decimals))
      }
    })();
  }, [price, decimals, data])

  // block update event updating balance
  useEffect(() => {
    if (library && !library._events.length && superTokenContract) {
      library.on('block', async (bh) => {
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
    if (!superfluid) {
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
      if (Number(await superTokenContract.allowance(account, superTokenContract.address)) < Number(item.price)) {
        const approve = await superTokenContract.approve(superTokenContract.address, ethers.BigNumber.from(item.price))
        await approve.wait()
      }

      // wrap
      const wrap = await superTokenContract.upgrade(ethers.BigNumber.from(item.price))
      await wrap.wait()
    }

    const buyer = superfluid.user({
      address: account,
      token: superTokenContract.address,
    })
    const flowRate = Math.floor(item.price / (3600 * 24 * 30))

    const flow = {
      recipient: address,
      flowRate: flowRate.toString(),
    }
    await buyer.flow(flow)

    setBuying(false)
    setFlow(flow)
  }

  const cancel = async () => {
    if (!superfluid) {
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
      <p>{address}</p>
      <Loading loading={loading}>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <If condition={deployed}>
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
                </Else>
              </If>
            </Else>
          </If>
        </If>
      </Loading>
    </div>
  )
}

export default ItemsView
