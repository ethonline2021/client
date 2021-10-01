import { useWeb3React } from "@web3-react/core"
import { Button } from "antd"
import { ethers, BigNumber, Contract } from "ethers"
import { useEffect, useState } from "react"
import Loading from "../components/Loading"
import { If } from "react-if"

const SuperfluidSDK = require("@superfluid-finance/js-sdk")

const UtilsView = () => {
  const [ fDaiContract, setFDaiContract ] = useState<Contract | null>()
  const [ fDaiXContract, setFDaiXContract ] = useState<Contract | null>()
  const [ fDaiBalance, setFDaiBalance ] = useState<BigNumber>(ethers.BigNumber.from(0))
  const [ fDaiXBalance, setFDaiXBalance ] = useState<BigNumber>(ethers.BigNumber.from(0))
  const { account, library } = useWeb3React()
  const [ loading, setLoading ] = useState(false)

  const [ superfluid, setSuperfluid ] = useState()

  useEffect(() => {
    ;(async () => {
      if(!library) return;

      const tokenSymbol = "fDAI";
      const sfVersion = "v1";
      const sf = new SuperfluidSDK.Framework({
        ethers: library,
        tokens: [tokenSymbol],
      });
      await sf.initialize();
      
      setSuperfluid(sf);

      if(!fDaiContract || !fDaiXContract){
        const {
            ISuperToken,
            TestToken,
        } = sf.contracts;
  
        const daiAddress = await sf.resolver.get(`tokens.${tokenSymbol}`);
        const daixAddress = await sf.resolver.get(`supertokens.${sfVersion}.${tokenSymbol}x`);

        setFDaiContract(await TestToken.at(daiAddress));
        setFDaiXContract(await ISuperToken.at(daixAddress));
      }

      fetchBalances();
    })();
  }, [account, fDaiContract, fDaiXContract, library])

  const fetchBalances = async () => {
    if(fDaiContract){
      setFDaiBalance(await fDaiContract.balanceOf(account));
    }

    if(fDaiXContract) {
      setFDaiXBalance(await fDaiXContract.balanceOf(account));
    }
  }

  const mintFDai = async () => {
    if(!fDaiContract) return;

    setLoading(true);

    await fDaiContract.mint(account, ethers.utils.parseEther("1000"));
    fDaiContract.once("Transfer", async (from, to, value) => {
        console.log('fDai minted: ', value.toString());
        await fetchBalances();
        setLoading(false);
    });
  }

  const wrap = async () => {
    if(!fDaiXContract || !fDaiContract) return;

    setLoading(true);
    let tx;
    if(await fDaiContract.allowance(account, fDaiContract.address) < fDaiBalance){
      tx = await fDaiContract.approve(fDaiXContract.address, fDaiBalance);
      await tx.wait();
    }
    
    tx = await fDaiXContract.upgrade(fDaiBalance);
    await tx.wait();

    fetchBalances();
    setLoading(false);
  }

  const unwrap = async () => {
    if(!fDaiXContract || !fDaiContract) return;
    setLoading(true);

    let tx =  await fDaiXContract.downgrade(fDaiXBalance);
    await tx.wait();

    fetchBalances();
    setLoading(false);
  }

  return (
    <div>
      <Loading loading={loading}>
          <div>
            fDai Balance: {ethers.utils.formatEther(fDaiBalance)} fDai
            <Button type="primary" onClick={mintFDai}>Mint some...</Button>
            <If condition={+fDaiBalance.toString() > 0}>
              <Button type="default" onClick={wrap}>Wrap all as SuperToken</Button>
            </If>
          </div>
          <div>
            fDaiX Balance: {ethers.utils.formatEther(fDaiXBalance)} fDaiX
            <If condition={+fDaiXBalance.toString() > 0}>
              <Button type="default" onClick={unwrap}>UnWrap all</Button>
            </If>
          </div>
      </Loading>
    </div>
  )
}

export default UtilsView;
