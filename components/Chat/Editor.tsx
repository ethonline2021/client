import { Button, Form, Input } from "antd"
import { KeyboardEvent } from "react"
import { If } from "react-if"

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
    <>
      <Form.Item>
        <Input.TextArea
          rows={4}
          onChange={onChange}
          onKeyUp={onKeyUp}
          value={value}
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          disabled={status !== 'Ready'}
          onClick={onSubmit}
        >
          Send
        </Button>
        <If condition={status !== 'Ready'}>{status}</If>
      </Form.Item>
    </>
  )
}

export default Editor
