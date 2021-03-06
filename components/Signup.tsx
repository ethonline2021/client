import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { Alert, Button, Form, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { If } from 'react-if'

import { useContracts } from '../hooks/contracts'
import { useMetaTx } from '../hooks/metatx'
import networks from "../networks"

const SignUp = ({visible, close, onComplete} : {visible: boolean, close: () => void, onComplete: (result: any) => void}) => {
  const { main, setDeployed } = useContracts()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<string|undefined>()

  const { chainId } = useWeb3React();
  const { executeMetaTx } = useMetaTx();

  const onSend = async (values: any) => {
    if(!chainId) return

    setLoading(true)
    let transaction : TransactionResponse
    let rcpt : TransactionReceipt
    try {
      setStep('Deploying your user contract')
      if(process.env.NEXT_PUBLIC_BICONOMY_ENABLED == "true"){
        transaction = await executeMetaTx('Main', networks[chainId].main as string, 'deployUser', [values.username, values.description]);
      }else{
        transaction = await main.deployUser(values.username, values.description)
      }

      setStep('Waiting for transaction confirmation')
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
        <If condition={Boolean(step)}>
          <Alert type="info" message={step} />
        </If>
      </Form>
    </Modal>
  )
}

export default SignUp
