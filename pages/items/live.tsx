import { useWeb3React } from "@web3-react/core"
import { message } from "antd"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { useEagerConnect } from "../../hooks"

const LiveView = () => {
  const [ address, setAddress ] = useState()
  // const { account } = useWeb3React()
  const { push } = useRouter()

  useEffect(() => {
    const addr = document.location.hash.replace(/^#/, '')
    if (!ethers.utils.isAddress(addr)) {
      message.warning('Invalid address specified')
      push('/')
    }

    setAddress(addr)
  }, [])

  useEagerConnect()

  return <p>{address}</p>
}

LiveView.getLayout = (children) => <div>{children}</div>

export default LiveView
