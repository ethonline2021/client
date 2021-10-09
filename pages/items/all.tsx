import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Col, Row } from "antd"
import styled from "styled-components"

import Item from "../../components/Item"
import Loading from "../../components/Loading"

const AllItemsList = () => {
  const ITEMS_LIST = gql`
    {
      items {
        id
        title
        description
        address
        uri
        price
        token
      }
    }
  `
  const { loading, error, data } = useQuery(ITEMS_LIST)

  return (
    <Loading loading={loading}>
      { data && data.items.length > 0 &&
        <>
          <ItemsList gutter={[24, 24]}>
            {data.items.map((item, id) => {
              return (
                <Col key={id} xs={24} sm={8}>
                  <Item key={id} {...item} />
                </Col>
              )
            })}
          </ItemsList>
        </>
      }
    </Loading>
  )
}

const ItemsList = styled(Row)`
	display: flex;
	flex-wrap: wrap;
  margin-bottom: 40px;
`

export default AllItemsList

