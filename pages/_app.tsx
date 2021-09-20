import type { AppProps } from 'next/app'
import { Layout, Menu, Breadcrumb } from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'

import GlobalStyle from '../styles/globalStyles'

import "antd/dist/antd.css"

function MyApp({ Component, pageProps }: AppProps) {
  return <>
    <GlobalStyle />
    <Layout>
      <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">Home</Menu.Item>
          <Menu.Item key="2">Creators</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            <Component {...pageProps} />
          </Content>
        </Layout>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Shadowy &amp; Òscar C. &copy;2021</Footer>
    </Layout>
  </>
}
export default MyApp
