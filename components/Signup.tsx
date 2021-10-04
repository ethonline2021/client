import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { Button, Form, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { useContracts } from '../hooks'

const SignUp = ({visible, close, onComplete} : {visible: boolean, close: () => void, onComplete: (result: any) => void}) => {
  const { main, setDeployed } = useContracts()
  const [loading, setLoading] = useState(false)

  const onSend = async (values: any) => {
    setLoading(true)
    let transaction : TransactionResponse
    let rcpt : TransactionReceipt
    try {
      transaction = await main.deployUser(values.username, values.description)
      rcpt = await transaction.wait(1)
    } catch (e) {
      console.error(e)
      setLoading(false)
      return false
    }

    // TODO improve this
    if (rcpt && !rcpt.status) {
      console.error(rcpt)
    }


    const [ depl ] = rcpt.events?.filter((x: any) => x.event == "UserDeployed");

    setDeployed(depl.args.contractAddress)

    onComplete(rcpt)
    setLoading(false)

    return rcpt
  }

  return (
    <Modal title="SignUp" visible={visible}
      footer={[
        <Button
          form="signup-modal-form"
          key="submit"
          htmlType="submit"
          type="primary"
          loading={loading}
          disabled={loading}
        >
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
