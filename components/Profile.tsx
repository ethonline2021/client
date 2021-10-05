import { useWeb3React } from '@web3-react/core'
import { Button, Form, Input, Modal } from 'antd'
import { ethers } from 'ethers'
import {TransactionReceipt} from '@ethersproject/abstract-provider'
import { useEffect, useRef, useState } from 'react'
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
  const [ username, setUsername ] = useState<string|undefined>()
  const [ description, setDescription ] = useState<string|undefined>()
  const [ loading, setLoading ] = useState(false)
  const [ dpl, setDpl ] = useState<ethers.Contract|undefined>()
  const form = useRef(null)

  useEffect(() => {
    ;(async () => {
      if (deployed && !loading && (!username && !description || (username && description && dpl.address !== deployed.address))) {
        setLoading(true)
        setDpl(deployed)
        const [, user, desc] = await deployed.getDetails()
        setLoading(false)

        setUsername(user)
        setDescription(desc)

        if (form.current) {
          form.current.setFieldsValue({
            username: user,
            description: desc,
          })
        }
      }
    })()
  }, [account, deployed, dpl, loading, username, description, form])

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
        ref={form}
      >
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

export default Profile
