import { useWeb3React } from "@web3-react/core"
import * as Antd from "antd"
import { BasicProps, Header as AntdHeader } from 'antd/lib/layout/layout'
import { ethers } from "ethers"
import { useContext, useEffect, useState } from "react"
import styled from "styled-components"
import { injected } from "../connectors"
import { useContracts, useEagerConnect } from "../hooks"
import { useErrors } from "../providers"

const Account = styled.div`
  margin-left: auto;
`

const AppHeader : React.FunctionComponent<BasicProps> = styled(AntdHeader)`
  display: flex;
`

const Menu = () => {
  const {activate, deactivate, account, active, error, connector, library} = useWeb3React()
  const {main} = useContracts()
  const {setError} = useErrors()

  const [activatingConnector, setActivatingConnector] = useState<any>()
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  const triedEager = useEagerConnect()

  setError('')
  if (error) {
    setError(error.message)
  }

  const onWalletBtnClick = async () => {
    setActivatingConnector(injected)

    if (active) {
      return deactivate()
    }

    await activate(injected, undefined, true)
  }

  return (
    <AppHeader className="header">
      <div className="logo" />
      <Antd.Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
        <Antd.Menu.Item key="1">Home</Antd.Menu.Item>
        <Antd.Menu.Item key="2">Creators</Antd.Menu.Item>
      </Antd.Menu>
      {/* <Account>
        <Antd.Button onClick={onWalletBtnClick}>
          {signedUp ? 'Connected to ' + account : 'Wallet Connect'}
        </Antd.Button>
      </Account> */}
    </AppHeader>
  )
}

export default Menu
