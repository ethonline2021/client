import { useWeb3React } from "@web3-react/core"
import { message, PageHeader } from "antd"
import { Content } from "antd/lib/layout/layout"
import axios from "axios"
import { ethers } from "ethers"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef, useState } from "react"
import { Else, If, Then } from "react-if"

import Loading from "../../components/Loading"
import Video from "../../components/Video"
import { useEagerConnect, useItem } from "../../hooks"

const LiveView = () => {
  const [ address, setAddress ] = useState<string|undefined>()
  const { account, library } = useWeb3React()
  const { push } = useRouter()
  const { item, loading, itemContract } = useItem(account, address, library)
  const [ liveInfo, setLiveInfo ] = useState<{rtmp: string, playbackUrl: string, active: boolean} | undefined>()

  // get address from url
  useEffect(() => {
    const addr = document.location.hash.replace(/^#/, "")
    if (!ethers.utils.isAddress(addr)) {
      message.warning("Invalid address specified")
      push("/")
    }

    setAddress(addr)
  }, [push])

  // retrieve stream info
  useEffect(() => {
    let interval : NodeJS.Timer
    const fetchInfo = async () => {
      if (address) {
        try {
          const stream = await axios.get(`/api/stream`, {
            params: {
              id: address,
            }
          })

          if (stream.data.active !== liveInfo?.active) {
            setLiveInfo(stream.data)
          }
        } catch (e) {
          console.error('error retrieving stream info:', e)
        }
      }
    }

    ;(async () => {
      await fetchInfo()
      if (!interval) {
        interval = setInterval(fetchInfo, 10000)
      }
    })()

    return () => {
      clearInterval(interval)
    }
  }, [address, liveInfo])

  useEffect(() => {
    ;(async () => {
      if ((address && itemContract && account && item) && item.owner !== address) {
        // await itemContract.balanceOf(account)
      }
    })()
  }, [itemContract, address, item, account])

  useEagerConnect()

  return (
    <Loading loading={loading}>
      <PageHeader title={item.title} style={{margin: 'auto'}}>
        <Content>
          <p>{item.description}</p>
          <If condition={item.owner === account}>
            <Then>
              <p>To start streaming, connect your streaming program to {liveInfo?.rtmp}</p>
            </Then>
            <Else>
              <If condition={liveInfo?.active}>
                <Then>
                  {() =>
                    <Video
                      src={liveInfo.playbackUrl}
                    />
                  }
                </Then>
                <Else>
                  <p>Streaming has not started yet</p>
                </Else>
              </If>
            </Else>
          </If>
        </Content>
      </PageHeader>
    </Loading>
  )
}

LiveView.getLayout = (children) => <div>{children}</div>

export default LiveView
