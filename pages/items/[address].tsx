import { useQuery, gql } from "@apollo/client"
import { useWeb3React } from "@web3-react/core"
import { Button, PageHeader, Tag } from "antd"
import { ethers, Contract } from "ethers"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Else, If, Then } from "react-if"

import ItemContract from "../../contracts/contracts/Item.sol/Item.json"
import Loading from "../../components/Loading"
import { useContracts } from "../../hooks/contracts"
import { useItem } from "../../hooks"
import { decimal, parseItem } from "../../lib"
import { Content } from "antd/lib/layout/layout"

import SuperfluidSDK from "@superfluid-finance/js-sdk"
import { useErrors } from "../../providers"
import { useFlow, useGraphFlow, useSuperfluid } from "../../hooks/superfluid"
import styled from "styled-components"

const ItemsView = () => {
  const router = useRouter()
  const [ realBalance, setRealBalance ] = useState(ethers.BigNumber.from(0))
  const [ price, setPrice ] = useState(0)
  const [ block, setBlock ] = useState(0)
  const [ updating, setUpdating ] = useState(false)
  const [ contentLoading, setContentLoading ] = useState(false)
  const { address } = router.query
  const { account, library } = useWeb3React()
  const [ buying, setBuying ] = useState(false)

  const [ decimals, setDecimals ] = useState(0)
  const { item, loading, itemContract } = useItem(account, address, library)
  const { setError } = useErrors()
  const [ stock, setStock ] = useState(0)
  const [ paid, setPaid ] = useState(ethers.BigNumber.from(0))
  const { superfluid, superTokenContract, tokenContract } = useSuperfluid(library)
  const {flow, setFlow, loading: loadingFlow} = useGraphFlow(address)
  const [ status, setStatus ] = useState<string|undefined>()
  const [ symbol, setSymbol ] = useState<string|undefined>()
  const [ hasNft, setHasNft ] = useState<boolean>(false)

  // grab & set decimals
  useEffect(() => {
    ;(async () => {
      if (!decimals && superTokenContract) {
        try {
          const dec = await superTokenContract.decimals()
          setDecimals(dec)
        } catch (e) {
          console.error('error grabbing decimals')
        }
      }
    })()
  }, [decimals, superTokenContract])

  // grab and set balance & stock
  useEffect(() => {
    ;(async () => {
      if (superTokenContract && !updating && realBalance.isZero() && address && item.owner === account && itemContract) {
        setUpdating(true)
        try {
          setRealBalance(await superTokenContract.balanceOf(address))
          setPaid(await itemContract.totalPaid(account))
          setContentLoading(false)
        } catch (e) {
          console.error('error grabbing balance:', e)
          setUpdating(false)

          return
        }

        try {
          setStock(Number(await itemContract.availableAmount()))
        } catch (e) {
          console.error('error grabbing available slots:', e)
        }

        setUpdating(false)
      }
    })()
  }, [address, block, superTokenContract, realBalance, updating, account, item, itemContract])

  // set price
  useEffect(() => {
    ;(async () => {
      if (!price && decimals && item) {
        setPrice(item.price / Math.pow(10, decimals))
      }
    })();
  }, [price, decimals, item])

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

  // grab & set symbol
  useEffect(() => {
    ;(async () => {
      if (!symbol && tokenContract) {
        setSymbol(await tokenContract.symbol())
      }
    })(symbol)
  }, [tokenContract, symbol])

  // block update event updating balance
  useEffect(() => {
    if (library && !library._events.length && superTokenContract && decimals) {
      library.on('block', async (bh: any) => {
        setBlock(bh)
        if (updating) {
          return false
        }

        setUpdating(true)
        setPaid(await itemContract.totalPaid(account))
        setStock(Number(await itemContract.availableAmount()))
        setRealBalance(await superTokenContract.balanceOf(address))
        setUpdating(false)
      })
    }

    return () => {
      if (library && library._events.length) {
        library.removeAllListeners('block')
      }
    }
  }, [account, address, block, superTokenContract, library, updating, itemContract, decimals])

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
        setStatus('minting some fake tokens')
        const mint = await tokenContract.mint(account, ethers.utils.parseEther("1000"))
        // wait for tx
        await mint.wait()
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
    const withdraw = await itemContract.withdrawEth(account)
    const waitres = await withdraw.wait()
    console.log('resulting waitres object:', waitres)
    setBuying(false)
  }

  return (
    <div>
      <Loading loading={loading}>
        <PageHeader
          title={item.title}
          onBack={() => history.back()}
        >
          <Content>
            <p>{item.description}</p>
            <p>
              The event will be accessible at: <Link href={`/items/live#${address}`}><a>{`/items/live#${address}`}</a></Link>
            </p>
            <If condition={item.owner?.toLowerCase() === account?.toLowerCase()}>
              <Then>
                <p>
                  Current income: {contentLoading ? 'loading..' : decimal(realBalance, decimals)}
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
                      >
                        Buy one for {price}{symbol} ({stock.toString()} left)
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
                                Cancel assistance
                              </Button>
                            </Else>
                          </If>
                          <InfoTag color='green'>Paid {decimal(paid, decimals)}{symbol} already (out of {price}{symbol})</InfoTag>
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
          </Content>
        </PageHeader>
      </Loading>
    </div>
  )
}

export default ItemsView

const Buttons = styled.div`
  display: flex;
  align-items: center;
`

const InfoTag : typeof Tag = styled(Tag)`
  margin-left: 10px;
`
