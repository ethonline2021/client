import { TransactionReceipt, TransactionRequest } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
} from 'antd'
import axios from 'axios'
import { ethers } from 'ethers'
import { useState } from 'react'

import Erc20 from '../contracts/contracts/utils/Erc20.sol/Erc20.json'
import { useContracts } from '../hooks'
import { Item } from '../types'

const CreateEvent = ({visible, close} : {visible: boolean, close: () => void}) => {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [endPaymentDate, setEndPaymentDate] = useState(new Date())
  const [amount, setAmount] = useState(0)

  const {deployed, signer} = useContracts()

  const onSubmit = async (item: Item) => {
    setLoading(true)
    const paytoken = new ethers.Contract(process.env.NEXT_PUBLIC_ERC20_PAYMENTS, Erc20.abi, signer)
    const preDecimals = await paytoken.decimals()
    const decimals = ethers.BigNumber.from(10).pow(preDecimals)
    const price = ethers.BigNumber.from(item.price).mul(decimals)
    console.log('address is:', paytoken.address)

    const response = await axios.post('/api/nfts/upload', item)


    let tx = await deployed.deployItem(
      item.title,
      item.description,
      price,
      paytoken.address,
      Math.floor(item.amount),
      item.endPaymentDate.unix(),
      response.data.link,
    )

    const rcpt = await tx.wait(1)

    console.log(rcpt)

    setLoading(false)
    close()
   }

  return (
    <Modal
      title="Create event"
      visible={visible}
      onCancel={close}
      footer={[
        <Button
          form="create-event-form"
          key="submit"
          htmlType="submit"
          loading={loading}
          disabled={loading}
          type="primary"
        >
          Create
        </Button>
      ]}
    >
      <Form
        layout="vertical"
        initialValues={title, description, price, endPaymentDate, amount}
        onFinish={onSubmit}
        id="create-event-form"
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{required: true}]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[{required: true}]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          label="Price"
          name="price"
          rules={[{required: true}]}
        >
          <Input type="number" step="0.00000001" min="0" />
        </Form.Item>
        <Form.Item label="Payment limit date" name="endPaymentDate" rules={[{required: true}]}>
          <DatePicker />
        </Form.Item>
        <Form.Item label="Items amount" name="amount" rules={[{required: true}]}>
          <Input type="number" step="1" min="1" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateEvent
