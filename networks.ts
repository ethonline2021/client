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
    main: '0xEEe9e22957C763Bc7A48A9022E025B69d16F9589',
    payments: '0xe3cb950cb164a31c66e32c320a800d477019dcff',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021_kovan/v0.0.17',
  },
  137: {
    key: 'polygon',
    title: 'Polygon',
  },
  80001: {
    key: 'mumbai',
    title: 'Mumbai testnet',
    main: '0x479d1C30BE4F3298D66ED4E07D9EeB5DCDc61a4E',
    payments: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021/v0.0.17',
  },
}

export const networkIds = () =>
  Object.keys(networks).map((key) => Number(key))

export default networks
