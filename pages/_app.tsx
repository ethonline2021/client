import { Web3Provider } from "@ethersproject/providers"
import { Web3ReactProvider } from "@web3-react/core"
import { Layout, Breadcrumb } from "antd"
import { ethers } from "ethers"
import type { AppProps } from "next/app"
import { useState } from "react"

import UserContract from '../contracts/contracts/User.sol/User.json'
import Header from "../components/Header"
import WalletErrors from "../components/WalletErrors"
import GlobalStyle from "../styles/globalStyles"
import { ContractsContext, ErrorsContext, IContractsContext } from "../providers"

import "antd/dist/antd.css"
import styled from "styled-components"
import networks from "../networks"
import { ApolloProvider } from "../hooks/apollo"

function getLibrary(provider) {
  return new Web3Provider(provider, 'any')
}

const Footer : typeof Layout.Footer = styled(Layout.Footer)`
  background-color: #001529;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
`

function MyApp({ Component, pageProps }: AppProps) {
  const [deployed, setDeployed] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [account, setAccount] = useState('')
  const [graph, setGraph] = useState('')
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
    graph,
    setGraph,
  }
  const [error, setError] = useState(null)

  return <>
    <GlobalStyle />
    <Layout style={{ minHeight: '100vh' }}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ApolloProvider>
          <ErrorsContext.Provider value={{error, setError}}>
            <ContractsContext.Provider value={contracts}>
              {
                Component.getLayout ?
                  Component.getLayout(<Component {...pageProps} />) : (<>
                      <Header />
                      <Layout.Content style={{ padding: "0 50px" }}>
                        <Layout style={{ padding: "24px 0" }}>
                          <Layout.Content style={{ padding: "0 24px", minHeight: '100wh' }}>
                            <Component {...pageProps} />
                            <WalletErrors />
                          </Layout.Content>
                        </Layout>
                      </Layout.Content>
                      <Footer>
                        With ❤️ for EthOnline 2021
                      </Footer>
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
