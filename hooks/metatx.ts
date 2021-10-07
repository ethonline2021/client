import {Biconomy} from "@biconomy/mexa"
import { useWeb3React } from "@web3-react/core"
import { ethers } from "ethers"
import { useContext, useEffect, useState } from "react"

import ContractMain from "../contracts/contracts/Main.sol/Main.json"
import ContractUser from "../contracts/contracts/User.sol/User.json"

type ContractName =
	| 'Main'
	| 'User'

// Initialize Constants
const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "verifyingContract", type: "address" },
  { name: "salt", type: "bytes32" },
];
const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "functionSignature", type: "bytes" }
];

export const useMetaTx = () => {  
  const { account, library, chainId } = useWeb3React()

  const [biconomy, setBiconomy] = useState<Biconomy>()
  const [metatxProvider, setMetatxProvider] = useState<ethers.providers.Web3Provider>()

  // init Biconomy
  useEffect(() => {
    ;(async () => {
      if(!library) return

      const bic: Biconomy = new Biconomy(library,{ apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY, debug: true})
      const metatxProv = new ethers.providers.Web3Provider(bic)
      
      setBiconomy(bic)
      setMetatxProvider(metatxProv)
    })()
  }, [account, library, chainId])

  const executeMetaTx = async (
    contractName: ContractName,
    contractAddress: string,
    fnName: string,
    fnParams: (string | number | boolean)[]): Promise<any> => {
      if(!library) throw "No Library set!"
      if(!chainId) throw "No ChainId set!"
      if(!biconomy) throw "No Biconomy setup!"

      const signer = library.getSigner()
      const userAddress = await signer.getAddress()
      let contract: ethers.Contract
      let contractInterface: ethers.utils.Interface

      console.log('Getting user signature');
      console.log('User address: ', userAddress);

      switch (contractName) {
        case 'Main':
          contract = new ethers.Contract(
            contractAddress,
            ContractMain.abi,
            biconomy.getSignerByAddress(userAddress)
          )
          contractInterface = new ethers.utils.Interface(ContractMain.abi)
          break
        case 'User':
          contract = new ethers.Contract(
            contractAddress,
            ContractMain.abi,
            biconomy.getSignerByAddress(userAddress)
          )
          contractInterface = new ethers.utils.Interface(ContractUser.abi)
          break
      }

      let nonce = await contract.getNonce(userAddress);
      let functionSignature = contractInterface.encodeFunctionData(fnName, fnParams);

      let message = {
        nonce: parseInt(nonce),
        from: userAddress,
        functionSignature: functionSignature
      }

      const dataToSign = JSON.stringify({
        types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType
        },
        domain: {
          name: contractName,
          version: "1",
          salt: ethers.utils.hexZeroPad((ethers.BigNumber.from(chainId)).toHexString(), 32),
          verifyingContract: contractAddress,
        },
        primaryType: "MetaTransaction",
        message: message
      });

      /*Its important to use eth_signTypedData_v3 and not v4 to get EIP712 signature 
      because we have used salt in domain data instead of chainId*/
      // Get the EIP-712 Signature and send the transaction
      let signature = await library.send("eth_signTypedData_v3", [userAddress, dataToSign])
      let { r, s, v } = getSignatureParameters(signature);
      let tx = await contract.executeMetaTransaction(userAddress, functionSignature, r, s, v);

      return tx
  }

//////////
/*helper*/

const getSignatureParameters = signature => {
  if (!ethers.utils.isHexString(signature)) {
      throw new Error(
          'Given value "'.concat(signature, '" is not a valid hex string.')
      );
  }
  var r = signature.slice(0, 66);
  var s = "0x".concat(signature.slice(66, 130));
  var v = "0x".concat(signature.slice(130, 132));
  v = ethers.BigNumber.from(v).toNumber();
  if (![27, 28].includes(v)) v += 27;
  return {
      r: r,
      s: s,
      v: v
  };
};

  return { executeMetaTx }
}
