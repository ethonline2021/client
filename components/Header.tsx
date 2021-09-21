import { useWeb3React } from "@web3-react/core"
import * as Antd from "antd"
import { BasicProps, Header as AntdHeader } from 'antd/lib/layout/layout'
import styled from "styled-components"
import { injected } from "../connectors"

const Account = styled.div`
  margin-left: auto;
`

const AppHeader : React.FunctionComponent<BasicProps> = styled(AntdHeader)`
  display: flex;
`

const Menu = () => {
  const {activate, deactivate, account, active, error, connector} = useWeb3React()

  // TODO improve this
  if (error) {
    console.error(error)
  }

  const onWalletBtnClick = () => {
    if (active) {
      return deactivate()
    }

    return activate(injected)
  }

  return (
    <AppHeader className="header">
      <div className="logo" />
      <Antd.Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
        <Antd.Menu.Item key="1">Home</Antd.Menu.Item>
        <Antd.Menu.Item key="2">Creators</Antd.Menu.Item>
      </Antd.Menu>
      <Account>
        <Antd.Button onClick={onWalletBtnClick}>
          {active ? 'Connected to ' + account : 'Wallet Connect'}
        </Antd.Button>
      </Account>
    </AppHeader>
  )
}

export default Menu
