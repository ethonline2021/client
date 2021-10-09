import { Button, Form, Input, Tag } from "antd"
import { KeyboardEvent } from "react"
import { If } from "react-if"
import styled from "styled-components"

const Editor = ({
  onChange,
  onSubmit,
  submitting,
  value,
  status,
}) => {
  const onKeyUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitting || status !== 'Ready') {
      return
    }

    if (e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <MessageBox>
      <Input.TextArea
        rows={1}
        onChange={onChange}
        onKeyUp={onKeyUp}
        value={value}
        style={{resize: 'none'}}
      />
      <Button
        type="primary"
        htmlType="submit"
        loading={submitting}
        disabled={status !== 'Ready'}
        onClick={onSubmit}
        style={{height: 'auto'}}
      >
        Send
      </Button>
      <If condition={status !== 'Ready'}>
        <InfoTag color='blue'>{status}</InfoTag>
      </If>
    </MessageBox>
  )
}

const InfoTag : typeof Tag = styled(Tag)`
  margin-left: 10px;
`

const MessageBox = styled.div`
  display: flex;
  align-items: stretch;
`

export default Editor
