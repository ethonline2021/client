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
  const {main, signer, setDeployed} = useContracts()
  const {account, active, activate, connector, library} = useWeb3React()
  const [contents, setContents] = useState()
  const [signupModal, setSignupModal] = useState(false)
  const [eventModal, setEventModal] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (active && main) {
        const deployed = await main.getDeployedUser(account)

        if (!/^0x0+0$/.test(deployed)) {
          setDeployed(deployed)
        } else {
          setContents()
        }
      } else {
        setContents(<p>Start by unlocking your wallet</p>)
      }
    })()
  }, [active, main, account, activate, setDeployed, signer])

 return (
    <>
    <Head>
      <title>Stream a buy</title>
    </Head>
    <div>
      <StyledTitle>
        <Typography.Title style={{fontSize: "60px", color: "#001628"}}>💸 Stream-A-Buy</Typography.Title>
        <Typography.Title style={{color: "#00162894"}} level={2}>Let the people pay by streams</Typography.Title>
      </StyledTitle>

      { contents }
      
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
  margin:0 0 50px 0;
  text-align:center;
`


export default Home
