import { useWeb3React } from '@web3-react/core'
import { Button, Form, Input, Modal } from 'antd'
import { ethers } from 'ethers'
import {TransactionReceipt} from '@ethersproject/abstract-provider'
import { useEffect, useState } from 'react'
import { useContracts } from '../hooks/contracts'
import { useErrors } from '../providers'

const Profile = ({
  visible,
  close,
  onComplete,
} : {
  visible: boolean,
  close: () => void,
  onComplete: (result: any) =>  void,
}) => {
  const { deployed } = useContracts()
  const { account } = useWeb3React()
  const { setError } = useErrors()
  const [username, setUsername] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (deployed && !username?.length && !description?.length) {
        const [, user, desc] = await deployed.getDetails()

        setUsername(user)
        setDescription(desc)
      }
    })()
  }, [account, deployed, username, description])

  const onSend = async (values: any) => {
    if (!deployed) {
      console.error('contracts not properly initialized')
      return
    }

    setLoading(true)

    const transaction = await deployed.update(values.username, values.description)
    const rcpt : TransactionReceipt = await transaction.wait(1)

    if (!rcpt.status) {
      setError(rcpt.logs.join(', '))
    }

    setLoading(false)
    setUsername(values.username)
    setDescription(values.description)

    onComplete(rcpt)
    close()

    return rcpt
  }

  return (
    <Modal title="Profile" visible={visible}
      footer={[
        <Button
          form="profile-modal-form"
          key="submit"
          htmlType="submit"
          loading={loading}
          disabled={loading}
          type="primary"
        >
          Submit
        </Button>
      ]}
      onCancel={close}
    >
      <p>{account}</p>
      <Form
        id="profile-modal-form"
        initialValues={{username, description}}
        onFinish={onSend}
      >
        <Form.Item label="Username" name="username">
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description" value={description}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default Profile
