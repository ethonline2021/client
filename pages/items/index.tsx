import { LoadingOutlined } from '@ant-design/icons'
import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Spin } from 'antd'
import Link from 'next/link'
import { ReactNode, useEffect } from "react"
import styled from "styled-components"

import Loading from "../../components/Loading"

const Item = ({title, description, address}) => {
  const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
  `

  const P = styled.p`
    flex: 1;
  `

  return (
    <Wrapper>
      <div>
        <Link href={`/items/${address}`}>
          <a>{title}</a>
        </Link>
      </div>
      <P>{description}</P>
    </Wrapper>
  )
}

const ItemsIndex = () => {
  const { account } = useWeb3React()
  const ITEMS_LIST = gql`
    {
      items(where: {owner: "${account}"}) {
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
        data && data.items.length && data.items.map((item, id) => {
          return <Item key={id} {...item} />
        })
      }
    </Loading>
  )
}

export default ItemsIndex
