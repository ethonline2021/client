import { useWeb3React } from "@web3-react/core"
import * as Antd from "antd"
import { BasicProps, Header as AntdHeader } from 'antd/lib/layout/layout'
import { ethers } from "ethers"
import { useRouter } from "next/dist/client/router"
import Link from 'next/link'
import { useContext, useEffect, useMemo, useState } from "react"
import styled from "styled-components"

import { injected } from "../connectors"
import { useContracts, useEagerConnect } from "../hooks"
import { useErrors } from "../providers"
import Wallet from "./Wallet"

const Account = styled.div`
  margin-left: auto;
`

const AppHeader : React.FunctionComponent<BasicProps> = styled(AntdHeader)`
/*   display: flex; */
`

const Menu = () => {
  const {connector} = useWeb3React()
  const {router} = useRouter()
  const {deployed} = useContracts()

  const items = useMemo(() => {
    return [
      {
        path: '/',
        link: 'Home',
      },
      {
        path: '/items/all',
        link: 'Explore',
      },
    ]
  }, [])

  const [menu, setMenu] = useState(items)

  const [activatingConnector, setActivatingConnector] = useState<any>()
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  useEagerConnect()

  useEffect(() => {
    if (deployed && menu.length === items.length) {
      setMenu([...items, {
        path: '/items',
        link: 'My items',
      }])
    }
  }, [deployed, items, menu])

  return (
    <AppHeader className="header">
      <div className="logo" />
      <Antd.Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
        {
          menu.map(({path, link}, id) => (
            <Antd.Menu.Item key={id}>
              <Link href={path}>
                <a>{link}</a>
              </Link>
            </Antd.Menu.Item>
          ))
        }
        <Antd.Menu.Item key={menu.length} style={{marginLeft: "auto"}}>
          <Wallet />
        </Antd.Menu.Item>
      </Antd.Menu>
    </AppHeader>
  )
}

export default Menu
