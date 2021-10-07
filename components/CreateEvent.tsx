import { TransactionReceipt, TransactionRequest } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
} from 'antd'
import axios from 'axios'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { If } from 'react-if'

import Erc20 from '../contracts/contracts/utils/Erc20.sol/Erc20.json'
import { useContracts } from '../hooks/contracts'
import networks from '../networks'
import { Item } from '../types'

const CreateEvent = ({visible, close} : {visible: boolean, close: () => void}) => {
  const [ loading, setLoading ] = useState(false)
  const [ title, setTitle ] = useState('')
  const [ description, setDescription ] = useState('')
  const [ price, setPrice ] = useState(0)
  const [ endPaymentDate, setEndPaymentDate ] = useState(new Date())
  const [ amount, setAmount ] = useState(0)
  const { push } = useRouter()
  const { account, library, chainId } = useWeb3React()
  const { deployed } = useContracts()
  const [ step, setStep ] = useState<string|undefined>()

  const onSubmit = async (item: Item) => {
    setLoading(true)
    let paytoken : ethers.Contract
    setStep('Initializing')
    try {
      const signer = library.getSigner(account)
      paytoken = new ethers.Contract(networks[chainId].payments, Erc20.abi, signer)
    } catch (e) {
      console.error('error initializing payments token (fDaix):', e)

      setLoading(false)
      return false
    }

    let price = ethers.BigNumber.from(0)
    try {
      const preDecimals = await paytoken.decimals()
      const decimals = ethers.BigNumber.from(10).pow(preDecimals)
      price = ethers.BigNumber.from(item.price).mul(decimals)
    } catch (e) {
      console.error('error grabbing decimals', e)

      setLoading(false)
      return false
    }

    let itemAddress : string
    try {
      setStep('Creating NFT files')
      const response = await axios.post('/api/nfts/upload', item)

      setStep('Deploying item contract')
      const tx = await deployed.deployItem(
        item.title,
        item.description,
        price,
        paytoken.address,
        Math.floor(item.amount),
        item.endPaymentDate.unix(),
        response.data.link,
        {
          gasPrice: 1000000000,
          gasLimit: 12500000,
        }
      )
      setStep('Waiting for transaction confirmation')
      const rcpt = await tx.wait(2)
      const [{args}] = rcpt.events?.filter((x: any) => x.event === "ItemDeployed")

      itemAddress = args.itemAddress
    } catch (e) {
      console.error('error deploying item:', e)
      setLoading(false)

      return false
    }

    setStep('✔ Done! Sending you there...')

    push(`/items/${itemAddress.toLowerCase()}`)
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
        <If condition={Boolean(step)}>
          <Alert type="info" message={step} />
        </If>
      </Form>
    </Modal>
  )
}

export default CreateEvent
