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
    main: '0xc0352d08CDBE8262956212adFc722c5a545e0861',
    payments: '0xe3cb950cb164a31c66e32c320a800d477019dcff',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021_kovan/v0.0.19',
  },
  137: {
    key: 'polygon',
    title: 'Polygon',
  },
  80001: {
    key: 'mumbai',
    title: 'Mumbai testnet',
    main: '0x55Dd452EB6F178e54b642085f93Ef546b34F18a7',
    payments: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021/v0.0.19',
  },
}

export const networkIds = () =>
  Object.keys(networks).map((key) => Number(key))

export default networks
