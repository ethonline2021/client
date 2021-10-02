import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Button } from "antd"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Else, If, Then } from "react-if"
import SuperfluidSDK from "@superfluid-finance/js-sdk"

import ERC20Contract from "../../contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json"
import Loading from "../../components/Loading"

const ItemsView = () => {
  const router = useRouter()
  const [ realBalance, setRealBalance ] = useState(ethers.BigNumber.from(0))
  const [ price, setPrice ] = useState(0)
  const [ block, setBlock ] = useState(0)
  const [ updating, setUpdating ] = useState(false)
  const [ erc20contract, setErc20Contract ] = useState()
  const { address } = router.query
  const { account, library } = useWeb3React()
  const [ buying, setBuying ] = useState(false)
  const [ flow, setFlow ] = useState<{
    timestamp: Date;
    flowRate: string;
    deposit: string;
    owedDeposit: string;
  }>()
  const [ outcome, setOutcome ] = useState(0)
  const [ superfluid, setSuperfluid ] = useState()
  const [ decimals, setDecimals ] = useState(0)

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

  useEffect(() => {
    ;(async () => {
      console.log(superfluid, library, item, account, erc20contract)
      if (!superfluid && library && item && item.owner.length && item.owner !== account && erc20contract) {
        console.log('enters')
        let sf : SuperfluidSDK.Framework
        try {
          sf = new SuperfluidSDK.Framework({
            ethers: library,
            tokens: ["fDAI"],
          });
          await sf.initialize();
          setSuperfluid(sf)
        } catch (e) {
          console.error('error initializing superfluid:', e)
        }

        try {
          const flow = await sf.cfa?.getFlow({
            receiver: address,
            sender: account,
            superToken: erc20contract.address,
          })
          setFlow(flow)
        } catch (e) {
          console.error('error grabbing user flow:', e)
        }
      }
    })()
  }, [account, address, erc20contract, library, item, superfluid])

  useEffect(() => {
    ;(async () => {
      if (!erc20contract && library) {
        let contract : ethers.Contract
        try {
          contract = new ethers.Contract(process.env.NEXT_PUBLIC_ERC20_PAYMENTS, ERC20Contract.abi, library.getSigner(account))
        } catch (e) {
          console.error('error initializing payments contract:', e)
        }
        setErc20Contract(contract)
        try {
          const dec = await contract.decimals()
          setDecimals(dec)
        } catch (e) {
          console.error('error grabbing decimals:', dec)
        }
      }
    })()
  }, [account, address, erc20contract, library])

  useEffect(() => {
    (async () => {
      if (erc20contract && !updating && realBalance.isZero() && address && item.owner === account) {
        setUpdating(true)
        try {
          setRealBalance(await erc20contract.balanceOf(address))
        } catch (e) {
          console.error('error grabbing balance:', e)
          setUpdating(false)
        }
      }
    })()
  }, [address, block, erc20contract, realBalance, updating, account, item])

  useEffect(() => {
    ;(async () => {
      if (!price && erc20contract && data) {
        const decimals = await erc20contract.decimals()
        const p = data.items[0].price
        setPrice(p / Math.pow(10, decimals))
      }
    })();
  }, [price, erc20contract, data])

  useEffect(() => {
    if (library && !library._events.length) {
      library.on('block', async (bh) => {
        setBlock(bh)
        if (updating) {
          return false
        }

        setUpdating(true)
        setRealBalance(await erc20contract.balanceOf(address))
        setUpdating(false)
      })
    }

    return () => {
      if (library && library._events.length) {
        library.removeAllListeners('block')
      }
    }
  }, [account, address, block, erc20contract, library, updating])

  const purchase = async () => {
    setBuying(true)

    let sf : SuperfluidSDK.Framework
    try {
      sf = new SuperfluidSDK.Framework({
        ethers: library,
        tokens: ["fDAI"],
      });
      await sf.initialize();
    } catch (e) {
      console.error('error initializing superfluid:', e)
    }

    // const balance = await erc20contract.balanceOf(account)
    // console.log('balance:', balance)

    const buyer = sf.user({
      address: account,
      token: erc20contract.address,
    })

    const flowRate = Math.floor(item.price / (3600 * 24 * 30));

    await buyer.flow({
      recipient: address,
      flowRate: flowRate.toString(),
    })

    setBuying(false)
  }

  return (
    <div>
      <p>{address}</p>
      <Loading loading={loading}>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <If condition={account}>
          <If condition={item.owner?.toLowerCase() === account?.toLowerCase()}>
            <Then>
              <p>
                Current income: {decimal(realBalance, decimals)}
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
                  You&apos;re already paying for it, paid already: {/* {decimal(outCome, decimals)} */}
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
