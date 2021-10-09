import { useWeb3React } from "@web3-react/core"
import { useErrors } from "../providers"

const WalletErrors = () => {
  const { error: walletError } = useErrors()
  const { error } = useWeb3React()

  if (!error && !walletError) {
    return null
  }

  return <p style={{color: 'red'}}>{(error && error.message) || walletError}</p>
}

export default WalletErrors
