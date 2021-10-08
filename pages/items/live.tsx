import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { message, PageHeader } from "antd"
import { Content } from "antd/lib/layout/layout"
import axios from "axios"
import { ethers } from "ethers"
import dynamic from "next/dynamic"
import Head from 'next/head'
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Else, If, Then } from "react-if"
import Chat from "../../components/Chat"

import Loading from "../../components/Loading"
import Video from "../../components/Video"
import { useEagerConnect, useItem } from "../../hooks"
import { useGraphFlow } from "../../hooks/superfluid"

const LiveView = () => {
  const [ address, setAddress ] = useState<string|undefined>()
  const { account, library } = useWeb3React()
  const { push } = useRouter()
  const { item, loading, itemContract } = useItem(account, address, library)
  const [ liveInfo, setLiveInfo ] = useState<{rtmp: string, playbackUrl: string, active: boolean} | undefined>()
  const { flow, loading: loadingFlow } = useGraphFlow(address)
  const [ hasNft, setHasNft ] = useState<boolean|undefined>()

  // get address from url
  useEffect(() => {
    if (addr?.length) return

    const addr = document.location.hash.replace(/^#/, "")
    if (!ethers.utils.isAddress(addr)) {
      message.warning("Invalid address specified")
      push("/")
    }

    setAddress(addr)
  }, [push])

  const fetchInfo = useCallback(() => {
    ;(async () => {
      if (address) {
        try {
          const stream = await axios.get(`${process.env.NEXT_PUBLIC_API_ENDPOINT}api/stream`, {
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
    })()
  }, [address, liveInfo])

  // retrieve stream info
  useEffect(() => {
    let interval : NodeJS.Timer

    ;(async () => {
      // for now, we don't care about the stream for the organizer
      if (!flow && (item && item.owner !== account)) {
        return
      }

      await fetchInfo()
      if (!interval) {
        interval = setInterval(fetchInfo, 10000)
      }
    })()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [account, address, fetchInfo, flow, item])

  useEffect(() => {
    ;(async () => {
      if ((!flow || flow && !flow.nftId) || hasNft !== undefined || !itemContract || !account) {
        return
      }

      let nftamount : Number = 0
      try {
        nftamount = (await itemContract.balanceOf(account, Number(flow.nftId))).toNumber()
      } catch (e) {
        console.error('could not fetch balance of NFT:', e)
        return
      }

      setHasNft(Boolean(nftamount))
    })()
  }, [flow, hasNft, itemContract, account])

  useEagerConnect()

  return (
    <Loading loading={loading || loadingFlow}>
      <Head>
        <title>{item.title} - Stream a buy</title>
      </Head>
      <PageHeader title={item.title} style={{margin: 'auto'}}>
        <Content>
          <p>{item.description}</p>
          <If condition={item.owner === account}>
            <Then>
              <p>To start streaming, connect your streaming program to {liveInfo?.rtmp}</p>
            </Then>
            <Else>
              <If condition={hasNft}>
                <Then>
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
                  <Chat
                    account={account}
                    contentTopic={`/stream-a-buy/1/${address}/proto`}
                  />
                </Then>
                <Else>
                  <p>Sorry but you don&apos;t have the required NFT for accessing this event</p>
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
