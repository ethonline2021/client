import { useWeb3React } from '@web3-react/core'
import { Button, Card, Tag } from 'antd'
import Meta from 'antd/lib/card/Meta'
import { ethers } from 'ethers'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSuperfluid } from '../hooks/superfluid'
import styled from 'styled-components'
import Erc20 from '../contracts/contracts/utils/Erc20.sol/Erc20.json'

const Item = ({title, description, address, price, token, uri}) => {
  const router = useRouter()
  const [ symbol, setSymbol ] = useState<string|undefined>()
  const { account, library } = useWeb3React()
  const [ tokenContract, setTokenContract ] = useState<ethers.Contract|undefined>()

  // grab & set symbol
  useEffect(() => {
    ;(async () => {
      if(!library) return;
      if(!tokenContract){
        const signer = library.getSigner(account)
        setTokenContract(new ethers.Contract(token, Erc20.abi, signer))
      }

      if (!symbol && tokenContract) {
        setSymbol(await tokenContract.symbol())
      }
    })()
  }, [library, tokenContract, symbol])

  return (
    <Card 
      onClick={() => router.push(`/items/${address}`)}
      hoverable={true}
      cover={<img alt="example" src={`${uri}/image.png`} />}
      actions={[]}
    >
      <Meta title={title} description={description} />
      <StyledDiv>
        <Button type="primary">Buy for {ethers.utils.formatEther(price)} {symbol}</Button>
      </StyledDiv>
    </Card>
  )
}


const StyledDiv = styled.div`
  display:flex;
  justify-content: space-between;
  margin-top:20px;
`
export default Item
