import { useErrors } from "../providers"

const WalletErrors = () => {
  const {error} = useErrors()

  if (!error) {
    return null
  }

  return <p style={{color: 'red'}}>{error}</p>
}

export default WalletErrors
