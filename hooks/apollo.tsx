import * as Apollo from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import networks from '../networks'

export const ApolloProvider = ({children}) => {
  const [ client, setClient ] = useState(new Apollo.ApolloClient({
    uri: '',
    cache: new Apollo.InMemoryCache(),
  }))
  const { chainId } = useWeb3React()

  useEffect(() => {
    if (chainId) {
      setClient(new Apollo.ApolloClient({
        uri: networks[chainId].graph,
        cache: new Apollo.InMemoryCache(),
      }))
    }
  }, [chainId])

  return (
    <Apollo.ApolloProvider client={client}>
      {children}
    </Apollo.ApolloProvider>
  )
}
