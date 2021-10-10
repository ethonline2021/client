import { LoadingOutlined, EyeOutlined, PlayCircleOutlined } from "@ant-design/icons"
import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Button, message, Spin, Table } from "antd"
import ButtonGroup from "antd/lib/button/button-group"
import { ethers } from "ethers"
import Link from "next/link"
import { useRouter } from "next/router"
import { ReactNode, useCallback, useEffect, useState } from "react"
import styled from "styled-components"

import ERC20Contract from "../../contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json"
import { useContracts } from "../../hooks/contracts"
import { decimal } from "../../lib"


const MyItemsList = () => {
  const { account, library } = useWeb3React()
  const { deployed } = useContracts()
  const { push } = useRouter()
  const ITEMS_LIST = gql`
    query Item($account: String!) {
      items(where: {owner: $account}) {
        id
        title
        description
        address
        endPaymentDate
        token
      }
    }
  `
  const { loading, error, data } = useQuery(ITEMS_LIST, {
    variables: {
      account,
    }
  })
  const [ items, setItems ] = useState([])
  const [ updating, setUpdating ] = useState(false)

  useEffect(() => {
    if (account && library && !deployed && push) {
      message.warn('You are not signed-up')
      push('/')
    }
  }, [account, deployed, library, push])

  const populateItems = useCallback(() => {
    ;(async () => {
      if (updating || !data.items.length) {
        return
      }

      setUpdating(true)
      const items = await Promise.all(
        data.items.map(async (item, key) => {
          const contract = new ethers.Contract(
            item.token,
            ERC20Contract.abi,
            library.getSigner(account)
          )
          const income = await contract.balanceOf(item.address)
          const symbol = await contract.symbol()
          const decimals = await contract.decimals()

          return {
            ...item,
            key: item.address,
            endPaymentDate: (new Date(item.endPaymentDate*1000)).toDateString(),
            actions: (
              <ButtonGroup key={key}>
                <Link href={`/items/${item.address}`} passHref>
                  <Button size='small' title='Details page'><EyeOutlined /></Button>
                </Link>
                <Link href={`/items/live#${item.address}`} passHref>
                  <Button size='small' title='Live page'><PlayCircleOutlined /></Button>
                </Link>
              </ButtonGroup>
            ),
            income: `${decimal(income, decimals)} ${symbol}`,
          }
        })
      )

      setItems(items)
      setUpdating(false)
    })();
  }, [account, data, library, updating])

  useEffect(() => {
    let interval : Number
    ;(async () => {
      if (!library || loading || !data || (data && !data.items) || (items && items.length)) {
        return
      }

      await populateItems()
      interval = setInterval(populateItems, 2000)

      return () => {
        if (interval) {
          clearInterval(interval)
        }
      }
    })()
  }, [account, data, items, library, loading, populateItems])

  return (
    <Table
      dataSource={items}
      columns={[
        {
          title: 'Event name',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Current income',
          dataIndex: 'income',
          key: 'income',
        },
        {
          title: 'End payment date',
          dataIndex: 'endPaymentDate',
          key: 'endDate',
        },
        {
          title: 'Actions',
          dataIndex: 'actions',
          key: 'actions',
        }
      ]}
      loading={loading}
    />
  )
}

export default MyItemsList
