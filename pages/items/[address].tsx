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
  const [ balance, setBalance ] = useState(ethers.BigNumber.from(0))
  const [ price, setPrice ] = useState(0)
  const [ block, setBlock ] = useState(0)
  const [ updating, setUpdating ] = useState(false)
  const [ erc20contract, setErc20Contract ] = useState()
  const { address } = router.query
  const { account, library } = useWeb3React()
  const [ buying, setBuying ] = useState(false)

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

  useEffect(() => {
    if (!erc20contract && library) {
      setErc20Contract(new ethers.Contract(process.env.NEXT_PUBLIC_ERC20_PAYMENTS, ERC20Contract.abi, library.getSigner(account)))
    }
  }, [account, address, erc20contract, library])

  useEffect(() => {
    ;(async () => {
      if (!updating && !block && erc20contract) {
        setUpdating(true)
        setBalance(await erc20contract.balanceOf(address))
        setUpdating(false)
      }
    })();
  }, [updating, block, erc20contract, address])

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
        setBalance(await erc20contract.balanceOf(address))
        setUpdating(false)
      })
    }

    return () => {
      if (library && library._events.length) {
        library.removeAllListeners('block')
      }
    }
  }, [account, address, erc20contract, library, updating])

  let item = {
    title: '',
    description: '',
    amount: 0,
    owner: '',
  }

  if (!loading && data && !item.title.length) {
    ([item] = data.items)
  }

  const purchase = async () => {
    setBuying(true)

    const sf = new SuperfluidSDK.Framework({
      ethers: library,
      tokens: ["fDAI"],
    });
    await sf.initialize();

    const balance = await erc20contract.balanceOf(account)
    console.log('balance:', balance.toString())
    
    const buyer = sf.user({
      address: account,
      token: erc20contract.address,
    })

    const flowRate = Math.floor(item.price / (3600 * 24 * 30));
    console.log('rate:', flowRate.toString())

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
        <If condition={item.owner?.toLowerCase() === account?.toLowerCase()}>
          <Then>
            <p>
              Current income: {balance.toString()}
            </p>
          </Then>
          <Else>
            <Button
              disabled={price === 0 || buying}
              loading={buying}
              onClick={purchase}
            >
              Buy one for {price}
            </Button>
          </Else>
        </If>
      </Loading>
    </div>
  )
}

export default ItemsView
