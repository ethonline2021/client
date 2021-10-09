import { useQuery, gql } from "@apollo/client"
import { ethers } from "ethers"
import { useCallback, useEffect, useState } from "react"

import ItemContract from "../contracts/contracts/Item.sol/Item.json"
import { decimal, parseItem } from "../lib"
import { useContracts } from "./contracts"

interface Flow {
  id: string,
  buyer: string,
  flowRate: string,
  status: string,
}

export const useItem = (account, address, library) => {
  const [item, setItem] = useState({
    title: '',
    description: '',
    amount: 0,
    owner: '',
    price: ethers.BigNumber.from(0),
    endPaymnentDate: new Date(),
    flowRate: "0",
    uri: '',
  })
  const [itemContract, setItemContract] = useState<ethers.Contract>()
  const [loading, setLoading] = useState(false)

  // set item contract
  useEffect(() => {
    if (!itemContract && library && account && address) {
      try {
        setItemContract(new ethers.Contract(address, ItemContract.abi, library.getSigner(account)))
      } catch (e) {
        console.error('could not set item contract:', e)
      }
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

export const useItemFlows = (account, address: string, library, decimals) => {
  const {itemContract} = useItem(account, address, library)
  const FLOWS_LIST = gql`query PurchaseFlows($address: String!) {
    purchaseFlows(where: {item: $address}) {
      id
      buyer
      status
      nftId
      flowRate
    }
  }`
  const {loading, data, error} = useQuery(FLOWS_LIST, {
    pollInterval: 5000,
    variables: {
      address,
    },
  })
  const [flows, setFlows] = useState<Flow[]>([])

  const updateFlows = useCallback(async () => {
    if (!data.purchaseFlows.length) {
      return
    }
    const flows = await Promise.all(
      data.purchaseFlows.map(async (flow) => ({
        ...flow,
        paid: decimal(await itemContract.totalPaid(flow.buyer), decimals),
      }))
    )
    setFlows(flows)
  }, [data, decimals, itemContract])

  useEffect(() => {
    let interval : Number
    ;(async () => {
      if (itemContract && decimals && !loading && data && !flows.length) {
        await updateFlows()

        interval = setInterval(updateFlows, 3000)
      }
    })()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [loading, data, flows, itemContract, decimals])

  return {
    loading,
    error,
    flows,
  }
}
