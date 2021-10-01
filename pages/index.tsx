import { Button, Input, Modal } from 'antd'
import { ethers } from 'ethers'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {If, Then, Else}  from 'react-if'
import { Client } from '@livepeer/webrtmp-sdk'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'

import UserContract from '../contracts/contracts/User.sol/User.json'
import SignUp from '../components/Signup'
import { useContracts } from '../hooks'
import { injected } from '../connectors'
import Profile from '../components/Profile'
import CreateEvent from '../components/CreateEvent'

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

          setContents(<>
            <p>
              You are signed up!
            </p>
            <p>
              <a onClick={() => setEventModal(true)}>Create event</a>
            </p>
          </>)
        } else {
          setContents(<p>You should sign-up first</p>)
        }
      } else {
        setContents(<p>Start by unlocking your wallet</p>)
      }
    })()
  }, [active, main, account, activate, setDeployed, signer])

  return (
    <div>
      {
        contents
      }
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
  )
}

export default Home
