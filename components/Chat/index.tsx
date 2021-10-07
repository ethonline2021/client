import { useWeb3React } from '@web3-react/core'
import { Comment } from 'antd'
import { Waku, WakuMessage } from 'js-waku'
import moment from 'moment'
import protons from 'protons'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Editor from './Editor'
import Message from './Message'

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

const sendMessage = (waku, contentTopic, {text, timestamp, account}) => {
  const payload = proto.ChatMessage.encode({
    timestamp,
    text,
    account,
  })

  return WakuMessage.fromBytes(payload, contentTopic).then((wakuMessage) =>
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

const Chat = ({contentTopic, account}: {contentTopic: string, account: string}) => {
  const [waku, setWaku] = useState(undefined)
  const [wakuStatus, setWakuStatus] = useState('None')
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState<string>('')
  const [sending, setSending] = useState(false)
  const roomRef = useRef(null)
  const [started, setStarted] = useState<boolean|undefined>()
  const [historyLoaded, setHistoryLoaded] = useState<boolean|undefined>()

  useEffect(() => {
    if (!!waku) return
    if (wakuStatus !== 'None' || started) return

    setStarted(true)

    setWakuStatus('Starting')

    Waku.create({ bootstrap: true }).then((waku) => {
      setWaku(waku)
      setWakuStatus('Connecting')
      waku.waitForConnectedPeer().then(() => {
        setWakuStatus('Ready')
      })
    })
  }, [waku, wakuStatus, started])

  // fetch message history
  useEffect(() => {
    ;(async () => {
      if (!waku || wakuStatus !== 'Ready' || messages.length || !contentTopic || !roomRef || historyLoaded) {
        return
      }

      try {
        let msgs = await waku.store.queryHistory([contentTopic]);
        msgs = msgs.map(decodeMessage).sort((a, b) => a.timestamp - b.timestamp).map(formatMessage)

        setMessages((currMessages) => [].concat(msgs).concat(currMessages))
        roomRef.current.scrollTop = roomRef.current.scrollHeight
      } catch (e) {
        console.log('error retrieving message history:', e)
      }

      setHistoryLoaded(true)
    })()
  }, [messages, waku, wakuStatus, contentTopic, historyLoaded])

  const processIncomingMessage = useCallback((msg) => {
    setMessages((currMessages) =>
      [].concat(currMessages).concat(formatMessage(decodeMessage(msg)))
    )
    roomRef.current.scrollTop = roomRef.current.scrollHeight
  }, [])

  // listeners
  useEffect(() => {
    if (!waku || !contentTopic) return

    waku.relay.addObserver(processIncomingMessage, [contentTopic])

    return function cleanUp() {
      waku.relay.deleteObserver(processIncomingMessage, [contentTopic])
    }
  }, [waku, wakuStatus, processIncomingMessage, contentTopic])

  const sendMessageOnClick = () => {
    if (wakuStatus !== 'Ready') return

    const msg = {
      text: message,
      timestamp: Date.now(),
      account,
    }

    setSending(true)
    sendMessage(waku, contentTopic, msg).then(() =>{
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

