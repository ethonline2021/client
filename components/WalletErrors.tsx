import { useWeb3React } from "@web3-react/core"
import { Alert } from "antd"
import { useEffect } from "react"
import { useErrors } from "../providers"

const WalletErrors = () => {
  const { error: walletError, setError } = useErrors()
  const { error } = useWeb3React()

  useEffect(() => {
    if (walletError && !error) {
      setTimeout(() => {
        setError('')
      }, 5000)
    }
  }, [walletError, error])

  if (!error && !walletError) {
    return null
  }

  return <Alert
    type='error'
    showIcon
    message={(error && error.message) || walletError}
  />
}

export default WalletErrors
