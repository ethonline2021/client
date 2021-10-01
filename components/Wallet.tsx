import { useWeb3React } from "@web3-react/core"
import { useEffect, useState } from "react"
import Link from 'next/link'

import { injected } from "../connectors"

import { useContracts, useEagerConnect } from "../hooks"
import SignUp from "./Signup"
import Profile from "./Profile"

const Wallet = () => {
  const { account: loggedAccount, activate, active, connector, library } = useWeb3React()
  const { main, signer, setDeployed, deployed, account, setAccount } = useContracts()
  const [signupModal, setSignupModal] = useState(false)
  const [profileModal, setProfileModal] = useState(false)

  useEagerConnect()

  useEffect(() => {
    ;(async () => {
      if (active && main) {
        let dpl : Contract = deployed
        if (account !== loggedAccount) {
          dpl = null
          setAccount(loggedAccount)
        }

        if (!dpl) {
          setDeployed(await main.getDeployedUser(loggedAccount))
        }
      }
    })()
  }, [active, main, loggedAccount, deployed, setDeployed, signer, account, setAccount])

  const unlock = () => {
    return activate(injected)
  }

  let button : ReactNode = (
    <a onClick={unlock}>
      Unlock wallet
    </a>
  )

  if (active && main) {
    if (deployed) {
      button = (
        <a onClick={() => setProfileModal(true)}>
          Profile
        </a>
      )
    } else {
      button = (
        <a onClick={() => setSignupModal(true)}>
          Signup
        </a>
      )
    }
  }

  return (
    <>
      {button}
      <SignUp
        visible={signupModal}
        close={() => setSignupModal(false)}
        onComplete={() => setSignupModal(false)}
      />
      <Profile
        visible={profileModal}
        close={() => setProfileModal(false)}
        onComplete={() => setProfileModal(false)}
      />
    </>
  )
}

export default Wallet
