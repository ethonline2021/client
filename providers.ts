import { useWeb3React } from "@web3-react/core"
import { ethers } from "ethers"
import React, { useContext, useEffect, useState } from "react"

export const ContractsContext = React.createContext({
  main: undefined,
})
