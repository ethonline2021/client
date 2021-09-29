import { Button, Form, Input, Modal } from 'antd'
import { useEffect } from 'react'
import { useContracts } from '../hooks'

const SignUp = ({visible, close, onComplete} : {visible: boolean, close: () => void, onComplete: (result: any) => void}) => {
  const { main } = useContracts()

  const onSend = async (values: any) => {
    const transaction = await main.deployUser(values.username, values.description)
    const rcpt = await transaction.wait(1)

    // TODO improve this
    if (!rcpt.status) {
      console.error(rcpt)
    }

    onComplete(rcpt)

    return rcpt
  }

  return (
    <Modal title="SignUp" visible={visible}
      footer={[
        <Button form="signup-modal-form" key="submit" htmlType="submit">
          Submit
        </Button>
      ]}
      onCancel={close}
    >
      <Form onFinish={onSend} id="signup-modal-form">
        <Form.Item label="Username" name="username">
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default SignUp
