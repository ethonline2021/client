import { Button, Input } from 'antd'
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
import WalletErrors from '../components/WalletErrors'
import Profile from '../components/Profile'
import { ethers } from 'ethers'

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
  const [deployedSC, setDeployedSC] = useState(null)

  useEffect(() => {
    ;(async () => {
      if (active && main) {
        const deployed = await main.getDeployedUser(account)
        setDeployedSC(deployed)

        if (!/^0x0+0$/.test(deployed)) {
          const dsc = new ethers.Contract(deployed, UserContract.abi, signer)
          setDeployed(dsc)

          setContents(<p>You are signed up! <a onClick={() => setProfileModal(true)}>Edit Profile</a></p>)
        } else {
          setContents(<a onClick={() => {
            setSignupModal(true)
          }}>Sign up</a>)
        }
      } else {
        setContents(<a onClick={() => {
          activate(injected)
        }}>Unlock wallet</a>)
      }
    })()
  }, [active, main, account, activate])

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
      <Profile
        visible={profileModal}
        deployed={deployedSC}
        close={() => setProfileModal(false)}
        onComplete={() => setProfileModal(false)}
      />
      <WalletErrors />
    </div>
  )
}

export default Home
