import { useQuery, gql } from "@apollo/client"
import { LoadingOutlined } from '@ant-design/icons'
import { useWeb3React } from "@web3-react/core"
import { Spin } from "antd"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { If } from "react-if"

import ItemContract from "../../contracts/contracts/Item.sol/Item.json"
import ERC20Contract from "../../contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json"
import Loading from "../../components/Loading"

const ItemsView = () => {
  const router = useRouter()
  const [ balance, setBalance ] = useState(ethers.BigNumber.from(0))
  const [ block, setBlock ] = useState(0)
  const [ updating, setUpdating ] = useState(false)
  const [ contract, setContract ] = useState()
  const [ erc20contract, setErc20Contract ] = useState()
  const { address } = router.query
  const { account, library } = useWeb3React()

  const ITEM_DETAILS = gql`
    {
      items(where: {id: "${address}"}) {
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
    ;(async () => {
      if (!updating && !block && erc20contract) {
        setUpdating(true)
        setBalance(await erc20contract.balanceOf(address))
        setUpdating(false)
      }
    })();
  }, [updating, block, erc20contract, address])

  useEffect(() => {
    if (!contract && library) {
      setContract(new ethers.Contract(address, ItemContract.abi, library.getSigner(account)))
    }

    if (!erc20contract && library) {
      console.log('erc20: ', process.env.NEXT_PUBLIC_ERC20_PAYMENTS)
      setErc20Contract(new ethers.Contract(process.env.NEXT_PUBLIC_ERC20_PAYMENTS, ERC20Contract.abi, library.getSigner(account)))
    }

    if (library) {
      library.on('block', async (bh) => {
        setBlock(bh)
        if (updating) {
          return
        }

        setUpdating(true)

        setBalance(await erc20contract.balanceOf(address))

        setUpdating(false)
      })
    }

    return () => {
      if (library) {
        library.removeAllListeners('block')
      }
    }
  }, [account, address, contract, erc20contract, library, updating])

  let item = {
    title: '',
    description: '',
    price: 0,
    amount: 0,
  }

  if (!loading && data && !item.title.length) {
    ([item] = data.items)
  }

  return (
    <div>
      <p>{address}</p>
      <Loading loading={loading}>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <p>
          Current income: {balance.toString()}
          <If condition={updating}>
            <Spin
              indicator={
                <LoadingOutlined style={{ fontSize: 16 }} spin />
              }
            />
          </If>
        </p>
      </Loading>
    </div>
  )
}

export default ItemsView
