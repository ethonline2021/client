import { useQuery, gql } from "@apollo/client"
import { Button, Col, Input, Modal, Row, Title, Typography } from 'antd'
import { ethers } from 'ethers'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { If, Then, Else }  from 'react-if'
import { Client } from '@livepeer/webrtmp-sdk'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'

import UserContract from '../contracts/contracts/User.sol/User.json'
import SignUp from '../components/Signup'
import { useContracts } from '../hooks/contracts'
import CreateEvent from '../components/CreateEvent'

const Home: NextPage = () => {
  const {main, signer, deployed} = useContracts()
  const {account, active, activate, connector, library} = useWeb3React()
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

          <Button href="/items/all" type="primary" size="large" style={{marginLeft:"10px"}}>Explore</Button>
        </Actions>
      </StyledTitle>

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
  margin:35px 0 50px 0;
  text-align:center;
`

const Actions = styled.div`
  margin-top: 40px;
`


export default Home
