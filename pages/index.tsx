import { useQuery, gql } from "@apollo/client"
import { Button, Input, Modal } from 'antd'
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
import { injected } from '../connectors'
import Profile from '../components/Profile'
import CreateEvent from '../components/CreateEvent'
import Loading from '../components/Loading'
import Item from '../components/Item'

const Video = styled.video`
  width: 100%;
`

let session = null

const Home: NextPage = () => {
  const {main, signer, setDeployed} = useContracts()
  const {account, active, activate, connector, library} = useWeb3React()
  const [contents, setContents] = useState()
  const [signupModal, setSignupModal] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [eventModal, setEventModal] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (active && main) {
        const deployed = await main.getDeployedUser(account)

        if (!/^0x0+0$/.test(deployed)) {
          setDeployed(deployed)

          setContents(
            <Button onClick={() => setEventModal(true)}>Create event</Button>
          )
        } else {
          setContents()
        }
      } else {
        setContents(<p>Start by unlocking your wallet</p>)
      }
    })()
  }, [active, main, account, activate, setDeployed, signer])

  const ITEMS_LIST = gql`
    {
      items(where: {owner_not_contains: "${account}"}) {
        id
        title
        description
        address
      }
    }
  `
  const { loading, error, data } = useQuery(ITEMS_LIST)

  return (
    <>
    <Head>
      <title>Stream a buy</title>
    </Head>
    <div>
      {
        contents
      }
      <Loading loading={loading}>
        {
          data && data.items.length > 0 && data.items.map((item, id) => {
            return <Item key={id} {...item} />
          })
        }
      </Loading>
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

export default Home
