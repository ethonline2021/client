import { useWeb3React } from '@web3-react/core'
import { Comment } from 'antd'
import { Waku, WakuMessage } from 'js-waku'
import moment from 'moment'
import protons from 'protons'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Editor from '../components/Chat/Editor'
import Message from '../components/Chat/Message'
import { useEagerConnect } from '../hooks'

const ContentTopic = `/aixo-vinc-ara-i-mho-invento-fins-q-ho-integri/2/whatever/proto`

const proto = protons(`
message ChatMessage {
  uint64 timestamp = 1;
  string text = 2;
  string account = 3;
}
`)

const formatMessage = ({timestamp, text, account}) => ({
  timestamp: moment(timestamp).format('HH:mm:ss'),
  text,
  account,
})

const Room = styled.div`
  max-height: 500px;
  overflow-y: scroll;
  margin-bottom: 20px;
`

const sendMessage = (waku, {text, timestamp, account}) => {
  const payload = proto.ChatMessage.encode({
    timestamp,
    text,
    account,
  })

  return WakuMessage.fromBytes(payload, ContentTopic).then((wakuMessage) =>
    waku.relay.send(wakuMessage)
  )
}

const decodeMessage = (msg) => {
  if (!msg.payload) return

  const { text, timestamp, account } = proto.ChatMessage.decode(
    msg.payload
  )

  return {
    text,
    timestamp,
    account,
  }
}

const Chat = () => {
  const [waku, setWaku] = useState(undefined)
  const [wakuStatus, setWakuStatus] = useState('None')
  const [messages, setMessages] = useState([])
  const {account} = useWeb3React()
  const [message, setMessage] = useState<string>('')
  const [sending, setSending] = useState(false)
  const roomRef = useRef(null)

  useEagerConnect()

  useEffect(() => {
    if (!!waku) return
    if (wakuStatus !== 'None') return

    setWakuStatus('Starting')

    Waku.create({ bootstrap: true }).then((waku) => {
      setWaku(waku)
      setWakuStatus('Connecting')
      waku.waitForConnectedPeer().then(() => {
        setWakuStatus('Ready')
      })
    })
  }, [waku, wakuStatus])

  // fetch message history
  useEffect(() => {
    ;(async () => {
      if (!waku || wakuStatus !== 'Ready' || messages.length) {
        return
      }

      try {
        let msgs = await waku.store.queryHistory([ContentTopic]);
        msgs = msgs.map(decodeMessage).sort((a, b) => a.timestamp - b.timestamp).map(formatMessage)

        setMessages((currMessages) => [].concat(msgs).concat(currMessages))
        roomRef.current.scrollTop = roomRef.current.scrollHeight
      } catch (e) {
        console.log('error retrieving message history:', e)
      }

    })()
  }, [messages, waku, wakuStatus])

  const processIncomingMessage = useCallback((msg) => {
    setMessages((currMessages) =>
      [].concat(currMessages).concat(formatMessage(decodeMessage(msg)))
    )
    roomRef.current.scrollTop = roomRef.current.scrollHeight
  }, [])

  // listeners
  useEffect(() => {
    if (!waku) return

    waku.relay.addObserver(processIncomingMessage, [ContentTopic])

    return function cleanUp() {
      waku.relay.deleteObserver(processIncomingMessage, [ContentTopic])
    }
  }, [waku, wakuStatus, processIncomingMessage])

  const sendMessageOnClick = () => {
    if (wakuStatus !== 'Ready') return

    const msg = {
      text: message,
      timestamp: Date.now(),
      account,
    }

    setSending(true)
    sendMessage(waku, msg).then(() =>{
      setMessage('')
      setSending(false)
      setMessages((currMessages) => [].concat(currMessages).concat(formatMessage(msg)))
      roomRef.current.scrollTop = roomRef.current.scrollHeight
    })
  }

  return (
    <>
      <Room ref={roomRef}>
        {
          messages.map((msg, i) => (
            <Message
              account={account}
              msg={msg}
              key={i}
            />
          ))
        }
      </Room>
      <Editor
        onChange={(e) => setMessage(e.target.value)}
        onSubmit={sendMessageOnClick}
        submitting={sending}
        value={message}
        status={wakuStatus}
      />
    </>
  )
}

export default Chat

