import { LoadingOutlined } from "@ant-design/icons"
import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Spin } from "antd"
import Link from "next/link"
import { ReactNode, useEffect } from "react"
import styled from "styled-components"

import Item from "../../components/Item"
import Loading from "../../components/Loading"

const AllItemsList = () => {
  const { account } = useWeb3React()
  const ITEMS_LIST = gql`
    {
      items(where: {owner_not_contains: "${account}"}) {
        id
        title
        description
        address
      }
    }
  `
  const { loading, error, data } = useQuery(ITEMS_LIST)

  return (
    <Loading loading={loading}>
      {
        data && data.items.length > 0 && data.items.map((item, id) => {
          return <Item key={id} {...item} />
        })
      }
    </Loading>
  )
}

export default AllItemsList
