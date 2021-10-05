import { Button, Input } from 'antd'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {If, Then, Else}  from 'react-if'
import { Client } from '@livepeer/webrtmp-sdk'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'

import SignUp from '../components/Signup'
import { useContracts } from '../hooks'
import { injected } from '../connectors'
import WalletErrors from '../components/WalletErrors'

const Video = styled.video`
  width: 100%;
`

let session = null

const Home: NextPage = () => {
  const videoEl = useRef(null)
  const stream = useRef(null)
  const [log, setLog] = useState(null)
  const [key, setKey] = useState('47df-j5cn-vdsb-3w1f')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    ;(async () => {
      videoEl.current.volume = 0

      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      videoEl.current.srcObject = stream.current
      videoEl.current.play()
    })()
  })

  const onStartClick = async () => {
    const streamKey = key

    if (!stream.current) {
      alert('Video stream was not started.')
    }

    if (!streamKey) {
      alert('Invalid streamKey.')
      return
    }

    const client = new Client()

    session = client.cast(stream.current, streamKey)

    session.on('open', () => {
      setLog('Stream started, check livepeer dashboard')
      setStatus(true)
    })

    session.on('close', () => {
      setLog('Stream stopped.')
      setStatus(false)
    })

    session.on('error', (err) => {
      setLog('Stream error.', err.message)
      setStatus(false)
    })
  }

  const onStopClick = async () => {
    session.close()
  }

  return (
    <div>
      <Input
        type="text"
        placeholder="streamKey"
        value={key}
        onChange={(e) => setKey(e.value)}
      />
      <Video ref={videoEl} />
      <If condition={status}>
        <Then>
          <Button onClick={onStopClick}>
            Stop
          </Button>
        </Then>
        <Else>
          <Button onClick={onStartClick}>
            Start
          </Button>
        </Else>
      </If>
      <p>
        {log || 'Press start to begin streaming'}
      </p>
    </div>
  )
}

export default Home
