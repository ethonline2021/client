import { useWeb3React } from "@web3-react/core"
import { Alert, Button, Image, PageHeader, Table, Tag } from "antd"
import { ethers } from "ethers"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { Else, If, Then } from "react-if"
import slug from 'slug'

import Loading from "../../components/Loading"
import { useItem } from "../../hooks/item"
import { decimal, parseItem } from "../../lib"
import { Content } from "antd/lib/layout/layout"

import { useErrors } from "../../providers"
import { useGraphFlow, useSuperfluid } from "../../hooks/superfluid"
import styled from "styled-components"
import { useItemFlows } from "../../hooks/item"
import ISuperToken from '../../contracts/@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol/ISuperToken.json'
import Erc20 from '../../contracts/contracts/utils/Erc20.sol/Erc20.json'

const ItemsView = () => {
  const router = useRouter()
  const [ realBalance, setRealBalance ] = useState(ethers.BigNumber.from(0))
  const [ price, setPrice ] = useState(0)
  const [ block, setBlock ] = useState(0)
  const { address } = router.query
  const { account, library } = useWeb3React()
  const [ buying, setBuying ] = useState(false)

  const [ decimals, setDecimals ] = useState(0)
  const { item, loading, itemContract } = useItem(account, address, library)
  const { setError } = useErrors()
  const [ stock, setStock ] = useState(0)
  const [ paid, setPaid ] = useState(ethers.BigNumber.from(0))
  const { superfluid } = useSuperfluid(library)
  const { flow, setFlow, loading: loadingFlow } = useGraphFlow(address)
  const { flows, loading: loadingFlows } = useItemFlows(account, address, library, decimals)
  const [ status, setStatus ] = useState<string|undefined>()
  const [ symbol, setSymbol ] = useState<string|undefined>()
  const [ hasNft, setHasNft ] = useState<boolean>(false)
  const [ tokenContract, setTokenContract ] = useState<ethers.Contract|undefined>()
  const [ superTokenContract, setSuperTokenContract ] = useState<ethers.Contract|undefined>()
  const [ensUrl, setEnsUrl] = useState<string|undefined>()
  const [ updating, setUpdating ] = useState<boolean>(false)

  // grab & set decimals
  useEffect(() => {
    ;(async () => {
      if(!library || !item.token) return;

      if (!superTokenContract) {
        const signer = library.getSigner(account)
        const stcontract = new ethers.Contract(item.token, ISuperToken.abi, signer);
        setSuperTokenContract(stcontract)

        const underlyingToken = await stcontract.getUnderlyingToken();
        const tContract = new ethers.Contract(underlyingToken, Erc20.abi, signer);
        setTokenContract(tContract);

        const decimals = await stcontract.decimals();
        setDecimals(decimals);
        setSymbol(await stcontract.symbol())

        setPrice(item.price / Math.pow(10, decimals))
      }
    })()
  }, [library, item, superTokenContract, account])

  const updateStuff = useCallback(() => {
    ;(async () => {
      if (!superTokenContract || !address || !account || !itemContract || updating || !item) {
        return
      }

      // could be improved with a Promise.all to grab in parallel
      setUpdating(true)
      if (item && item.owner === account) {
        try {
          setRealBalance(await superTokenContract.balanceOf(address))
        } catch (e) {
          console.error('error grabbing balance:', e)
        }
      }
      try {
        setPaid(await itemContract.totalPaid(account))
      } catch (e) {
        console.error('error grabbing total paid:', e)
      }
      try {
        setStock(Number(await itemContract.availableAmount()))
      } catch (e) {
        console.error('error grabbing stock:', e)
      }
      setUpdating(true)

    })()
  }, [account, address, item, itemContract, superTokenContract, updating])

  // grab and set stuff (+ init data update interval)
  useEffect(() => {
    let interval : Number

    ;(async () => {
      if (!superTokenContract || updating || !realBalance.isZero() || !address || !itemContract || !item) {
        return
      }

      await updateStuff()

      interval = setInterval(updateStuff, 3000)

      return () => {
        if (interval) {
          clearInterval(interval)
        }
      }
    })()
  }, [address, block, superTokenContract, realBalance, account, item, itemContract, updateStuff, updating])

  useEffect(() => {
    if (!ensUrl && item.title.length) {
      const sl = slug(item.title, '_')
      setEnsUrl(`https://${sl}.streamabuy.eth.link`)
    }
  }, [ensUrl, item])

  // grab nft amount
  useEffect(() => {
    ;(async () => {
      if (!item || !flow || !itemContract || !account) {
        return
      }

      if (flow.status !== 'Finished') {
        return
      }

      let nftamount : ethers.BigNumber = ethers.BigNumber.from(0)
      try {
        nftamount = await itemContract.balanceOf(account, flow.nftId)
      } catch (e)  {
        console.error('error grabbing nft amount:', e)
        return
      }

      setHasNft(Boolean(nftamount))
    })()

  }, [item, flow, itemContract, account])


  const purchase = async () => {
    if (!superfluid || !superTokenContract || !tokenContract) {
      console.error('superfluid not yet initialized')
      return false
    }

    setBuying(true)
    setStatus('initializing')
    if (!Number(await itemContract.availableAmount())) {
      const err = 'no items available for purchase'
      console.error(err)
      setError(err)
      setBuying(false)
      return false
    }

    // check for balance & top-up
    const balance = await superTokenContract.balanceOf(account)
    if (balance.lt(item.price)) {
      console.log('account does not have enough balance', balance.toString(), item.price.toString())
      // this should be only with superfluid test tokens
      if ((await tokenContract.balanceOf(account)).lt(item.price)) {
        const err = 'not enough tokens available to purchase'
        console.error(err)
        setError(err)
        setBuying(false)
        return false
      }

      // approve
      if ((await tokenContract.allowance(account, superTokenContract.address)).lt(item.price)) {
        setStatus('setting allowance')
        const approve = await tokenContract.approve(superTokenContract.address, ethers.BigNumber.from(item.price))
        await approve.wait()
      }

      try {
        // wrap
        setStatus('wraping tokens')
        const wrap = await superTokenContract.upgrade(ethers.BigNumber.from(item.price))
        await wrap.wait()
      } catch (e) {
        console.error('wrap failed:', e)
      }
    }

    let flowRate : ethers.BigNumber
    try {
      setStatus('checking required flow rate')
      flowRate = await itemContract.requiredFlowRate()
    } catch (e) {
      console.error('error fetching flow rate:', e)
      setBuying(false)

      return
    }

    const buyer = superfluid.user({
      address: account,
      token: superTokenContract.address,
    })

    const todate = item.endPaymentDate.getTime()

    const fl = {
      recipient: address,
      flowRate: flowRate.toString(),
      status: 'Started',
    }

    try {
      setStatus('initializing flow')
      await buyer.flow(fl)
    } catch (e) {
      console.error('error creating flow:', fl, e)
      setBuying(false)

      return
    }

    setStatus('done')
    setBuying(false)
    setFlow(fl)
    setTimeout(() => {
      setStatus()
    }, 3000)
  }

  const cancel = async () => {
    if (!superfluid || !superTokenContract || !tokenContract) {
      console.error('superfluid not yet initialized')
      return false
    }

    setBuying(true)

    const buyer = superfluid.user({
      address: account,
      token: superTokenContract.address,
    })

    const fl = {
      recipient: address,
      flowRate: '0',
      status: 'Cancelled?',
    }
    await buyer.flow(fl)

    setFlow(fl)
    setBuying(false)
  }

  const claim = async () => {
    if (!itemContract) {
      console.error('item contract not loaded :\\')

      return false
    }

    setBuying(true)
    const claim = await itemContract.claim(account)
    await claim.wait()
    setBuying(false)
  }

  const withdraw = async () => {
    if (!itemContract) {
      console.error('item contract not loaded :\\')

      return false
    }

    setBuying(true)
    const withdraw = await itemContract.withdrawErc20(account, superTokenContract.address)
    const waitres = await withdraw.wait()
    setBuying(false)
  }

  return (
    <>
      <Head>
        <title>{item.title} - Stream-a-buy</title>
      </Head>
      <Loading loading={loading}>
        <PageHeader
          title={item.title}
          onBack={() => history.back()}
        >
          <Content>
            <Image src={`${item.uri}/image.png`} style={{width:"400px"}} />
            <Text>{item.description}</Text>
            <p>
              The event will be accessible at: <Link href={`/items/live#${address}`}><a>{`/items/live#${address}`}</a></Link>
            </p>
            <Alert
              type='info'
              showIcon
              style={{marginBottom: '10px'}}
              message={
                <>We&apos;re working on friendly urls, so in a future you&apos;ll be able to access it through: {ensUrl}</>
              }
            />
            <p>
              This payment will be fully paid by the {item.endPaymentDate?.toDateString()}
            </p>
            <If condition={item.owner?.toLowerCase() === account?.toLowerCase()}>
              <Then>
                <p>
                  Current income: {decimal(realBalance, decimals)}
                </p>
                <Buttons>
                  <Button
                    onClick={withdraw}
                    loading={buying}
                    disabled={buying}
                    type='primary'
                  >
                    Withdraw {symbol}
                  </Button>
                </Buttons>
              </Then>
              <Else>
                <Buttons>
                  <If condition={!loadingFlow && (!flow || (flow && !flow.status))}>
                    <Then>
                      <Button
                        disabled={price === 0 || buying || !stock}
                        loading={buying}
                        onClick={purchase}
                        type="primary"
                      >
                        Buy one for {price} {symbol} ({stock.toString()} left)
                      </Button>
                    </Then>
                    <Else>
                      <If condition={flow && flow?.status === 'Started'}>
                        <Then>
                          <If condition={paid.gte(item.price)}>
                            <Then>
                              <Button
                                type='primary'
                                onClick={claim}
                              >
                                Claim
                              </Button>
                            </Then>
                            <Else>
                              <Button
                                onClick={cancel}
                                loading={buying}
                                disabled={buying}
                              >
                                Cancel
                              </Button>
                            </Else>
                          </If>
                          <InfoTag color='green'>Paid {decimal(paid, decimals)} {symbol} (out of {price} {symbol})</InfoTag>
                        </Then>
                        <Else>
                          <If condition={flow && flow.status === 'Finished' && hasNft}>
                            <p>You already purchased and claimed this 😊</p>
                          </If>
                        </Else>
                      </If>
                    </Else>
                  </If>
                  <If condition={status && status.length}>
                    <InfoTag color='blue'>
                      {status}
                    </InfoTag>
                  </If>
                </Buttons>
              </Else>
            </If>
            <If condition={item  && account && item.owner === account}>
              <>
                <FlowsTitle>Incoming flows</FlowsTitle>
                <Table
                  dataSource={
                    flows.map((flow, k) => ({
                      ...flow,
                      key: k,
                    }))
                  }
                  columns={[
                    {
                      title: 'Buyer',
                      dataIndex: 'buyer',
                      key: 'buyer',
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                    },
                    {
                      title: 'Paid already',
                      dataIndex: 'paid',
                      key: 'paid',
                    }
                  ]}
                />
              </>
            </If>
          </Content>
        </PageHeader>
      </Loading>
    </>
  )
}

export default ItemsView

const FlowsTitle = styled.h3`
  font-size: 22px;
  margin-top: 20px;
`

const Buttons = styled.div`
  display: flex;
  align-items: center;
`

const InfoTag : typeof Tag = styled(Tag)`
  margin-left: 10px;
  padding:5px 15px;
`

const Text = styled.p`
  font-size:20px;
`
