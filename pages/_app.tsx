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
  uri: process.env.NEXT_PUBLIC_GRAPH_ENDPOINT,
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
        let dpl : ethers.Contract
        try {
          dpl = new ethers.Contract(contract, UserContract.abi, signer)
          setDeployed(dpl)
        } catch (e) {
          console.error('error initializing user\'s deployed contract:', e)
        }
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
          <ErrorsContext.Provider value={{error, setError}}>
            <ContractsContext.Provider value={contracts}>
              {
                Component.getLayout ?
                  Component.getLayout(<Component {...pageProps} />) : (<>
                      <Header />
                      <Content style={{ padding: "0 50px" }}>
                        <Layout style={{ padding: "24px 0" }}>
                          <Content style={{ padding: "0 24px", minHeight: 280 }}>
                            <Component {...pageProps} />
                            <WalletErrors />
                          </Content>
                        </Layout>
                      </Content>
                      <Footer style={{ textAlign: "center" }}>Shadowy &amp; Òscar C. &copy;2021</Footer>
                    </>)
                  }
            </ContractsContext.Provider>
          </ErrorsContext.Provider>
        </ApolloProvider>
      </Web3ReactProvider>
    </Layout>
  </>
}
export default MyApp
