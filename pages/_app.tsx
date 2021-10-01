import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client"
import { Web3Provider } from "@ethersproject/providers"
import { Web3ReactProvider } from "@web3-react/core"
import { Layout, Breadcrumb } from "antd"
import { Content, Footer } from "antd/lib/layout/layout"
import { ethers } from "ethers"
import type { AppProps } from "next/app"
import { useState } from "react"

import UserContract from '../contracts/contracts/User.sol/User.json'
import Header from "../components/Header"
import WalletErrors from "../components/WalletErrors"
import GlobalStyle from "../styles/globalStyles"
import { ContractsContext, ErrorsContext, IContractsContext } from "../providers"

import "antd/dist/antd.css"

function getLibrary(provider) {
  return new Web3Provider(provider)
}

const client = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/10173/ethonline2021/v0.0.11",
  cache: new InMemoryCache(),
})

function MyApp({ Component, pageProps }: AppProps) {
  const [deployed, setDeployed] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [account, setAccount] = useState('')
  const contracts : IContractsContext = {
    deployed,
    setDeployed: (contract: string) => {
      if (!/^0x0+0$/.test(contract)) {
        setDeployed(new ethers.Contract(contract, UserContract.abi, signer))
      }
    },
    signer,
    setSigner,
    main: undefined,
    account,
    setAccount,
  }
  const [error, setError] = useState(null)

  return <>
    <GlobalStyle />
    <Layout>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ApolloProvider client={client}>
          <ContractsContext.Provider value={contracts}>
            <ErrorsContext.Provider value={{error, setError}}>
              <Header />
              <Content style={{ padding: "0 50px" }}>
                <Layout className="site-layout-background" style={{ padding: "24px 0" }}>
                  <Content style={{ padding: "0 24px", minHeight: 280 }}>
                    <Component {...pageProps} />
                    <WalletErrors />
                  </Content>
                </Layout>
              </Content>
              <Footer style={{ textAlign: "center" }}>Shadowy &amp; Òscar C. &copy;2021</Footer>
            </ErrorsContext.Provider>
          </ContractsContext.Provider>
        </ApolloProvider>
      </Web3ReactProvider>
    </Layout>
  </>
}
export default MyApp
