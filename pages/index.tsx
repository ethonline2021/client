import { Button, Col,Row, Typography } from 'antd'
import type { NextPage } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'

import SignUp from '../components/Signup'
import { useContracts } from '../hooks/contracts'
import CreateEvent from '../components/CreateEvent'

const Home: NextPage = () => {
  const {deployed} = useContracts()
  const [signupModal, setSignupModal] = useState(false)
  const [eventModal, setEventModal] = useState(false)

 return (
    <>
    <Head>
      <title>Stream-a-buy</title>
    </Head>
    <div>
      <StyledTitle>
        <Typography.Title style={{fontSize: "60px", color: "#001628", marginBottom: "0.1em"}}>💸 Stream-A-Buy</Typography.Title>
        <Typography.Title style={{marginTop: "0", color: "#00162894", fontWeight: "normal", "fontSize": "17px"}} level={2}>Let the people pay by streams</Typography.Title>

        <Actions>
          {!deployed &&
            <Button type="primary" size="large" onClick={() => setSignupModal(true)}>Signup</Button>
          }

          {deployed &&
            <Button type="primary" size="large" onClick={() => setEventModal(true)}>Start selling</Button>
          }

          <Link href="/items/all" passHref>
            <Button type="primary" size="large" style={{marginLeft:"10px"}}>Explore</Button>
          </Link>
        </Actions>
      </StyledTitle>

      <Row>
          <Col style={{textAlign: "center"}} span={16} offset={4}>
            <img src="/assets/ethereum.png" className="homesponsorimg" />
            <img src="/assets/superfluid.png" className="homesponsorimg" />
            <img src="/assets/polygon.svg" className="homesponsorimg" />
            <img src="/assets/skynet.svg" className="homesponsorimg" />
            <img src="/assets/thegraph.svg" className="homesponsorimg" />
            <img src="/assets/chainlink.png" className="homesponsorimg" />
            <img src="/assets/biconomy.svg" className="homesponsorimg" />
            <img src="/assets/ipfs.png" className="homesponsorimg" />
            <img src="/assets/livepeer.svg" className="homesponsorimg" />
            <img src="/assets/status.svg" className="homesponsorimg" />
            <img src="/assets/ens.svg" className="homesponsorimg" />
          </Col>
          {/* <Col span={10}>
            <StyledList>
              <li>✅ Streaming payments with no capital lockups</li>
              <li>✅ Own your purchases - With NFT's</li>
              <li>✅ Permanent storage - Content is forever available</li>
              <li>✅ Built in decentralized video streaming + chat</li>
              <li>✅ Super low fees</li>
            </StyledList>
          </Col> */}
      </Row>

      <SignUp
        visible={signupModal}
        close={() => setSignupModal(false)}
        onComplete={() => setSignupModal(false)}
      />

      <CreateEvent
        visible={eventModal}
        close={() => setEventModal(false)}
      />
    </div>
    </>
  )
}

const StyledTitle = styled.div`
  margin:35px 0 180px 0;
  text-align:center;
`

const Actions = styled.div`
  margin-top: 40px;
`
const StyledList = styled.ul`
  list-style: none;
  padding: 0;
  font-size:16px;
  color: #333;
`


export default Home
