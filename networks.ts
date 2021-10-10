export type Network = {
  key: string,
  title: string,
  main?: string,
  graph?: string,
  payments?: string,
}

export type Networks = {
  [key: number] : Network,
}

const networks : Networks = {
  42: {
    key: 'kovan',
    title: 'Kovan testnet',
    main: '0x1EC422B81f33F5FEb1CADf0F19aCD6988dc1d873',
    payments: '0xe3cb950cb164a31c66e32c320a800d477019dcff',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021_kovan/v0.1.2',
  },
  137: {
    key: 'polygon',
    title: 'Polygon',
  },
  80001: {
    key: 'mumbai',
    title: 'Mumbai testnet',
    main: '0x240C51c33077da7447550adAaafF7643150D5Fcc',
    payments: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021/v0.1.2',
  },
}

export const networkIds = () =>
  Object.keys(networks).map((key) => Number(key))

export default networks
