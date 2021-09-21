import type { AppProps } from 'next/app'
import { Layout, Breadcrumb } from 'antd'
import { Content, Footer } from 'antd/lib/layout/layout'
import { Web3Provider } from '@ethersproject/providers'
import { Web3ReactProvider } from '@web3-react/core'

import Header from '../components/Header'

import GlobalStyle from '../styles/globalStyles'

import "antd/dist/antd.css"

function getLibrary(provider) {
  return new Web3Provider(provider)
}

function MyApp({ Component, pageProps }: AppProps) {
  return <>
    <GlobalStyle />
    <Layout>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Header />
        <Content style={{ padding: '0 50px' }}>
          <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>
              <Component {...pageProps} />
            </Content>
          </Layout>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Shadowy &amp; Òscar C. &copy;2021</Footer>
      </Web3ReactProvider>
    </Layout>
  </>
}
export default MyApp
