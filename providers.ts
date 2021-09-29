import { useWeb3React } from "@web3-react/core"
import { ethers } from "ethers"
import { Contract } from '@ethersproject/contracts'
import { Signer } from '@ethersproject/abstract-signer'
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react"

export interface IContractsContext {
  main: Contract,
  deployed: Contract,
  setDeployed: Dispatch<SetStateAction>,
  signer: Signer,
  setSigner: Dispatch<SetStateAction>,
}

export const ContractsContext = React.createContext<Partial<IContractsContext>>({})

interface IErrorsContext {
  error: string,
  setError(error: string) : void,
}

export const ErrorsContext = React.createContext<IErrorsContext>(null)

export const useErrors = () : IErrorsContext => {
  const errors = useContext(ErrorsContext)
  if (errors === undefined) {
    throw new Error('useErrors must be used within an ErrorsContext')
  }

  return errors
}
