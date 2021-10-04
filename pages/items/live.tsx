import { useWeb3React } from "@web3-react/core"
import { message, PageHeader } from "antd"
import { Content } from "antd/lib/layout/layout"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Else, If, Then } from "react-if"
import Loading from "../../components/Loading"

import { useEagerConnect, useItem } from "../../hooks"

const LiveView = () => {
  const [ address, setAddress ] = useState()
  const { account, library } = useWeb3React()
  const { push } = useRouter()
  const { item, loading, itemContract } = useItem(account, address, library)

  useEffect(() => {
    const addr = document.location.hash.replace(/^#/, '')
    if (!ethers.utils.isAddress(addr)) {
      message.warning('Invalid address specified')
      push('/')
    }

    setAddress(addr)
  }, [])

  useEffect(() => {
    ;(async () => {
      if ((address && itemContract && account && item) && item.owner !== address) {
        // await itemContract.balanceOf(account)
      }
    })()
  }, [itemContract, address, item, account])

  useEagerConnect()

  return (
    <Loading loading={loading}>
      <PageHeader title={item.title}>
        <Content>
          <p>{item.description}</p>
          <If condition={item.owner === account}>
            <Then>
              <p>Livestream information on how to connect should be here</p>
            </Then>
            <Else>
              <p></p>
            </Else>
          </If>
        </Content>
      </PageHeader>
    </Loading>
  )
}

LiveView.getLayout = (children) => <div>{children}</div>

export default LiveView
