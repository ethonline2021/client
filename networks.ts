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
    main: '0x675f77951254a75D3196d094588F811d31E9fb94',
    payments: '0xe3cb950cb164a31c66e32c320a800d477019dcff',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021_kovan/v0.0.15',
  },
  137: {
    key: 'polygon',
    title: 'Polygon',
  },
  80001: {
    key: 'mumbai',
    title: 'Mumbai testnet',
    main: '0x46F08EEB89749cB802Bc7130C2063fbFd66B6912',
    payments: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
    graph: 'https://api.studio.thegraph.com/query/10173/ethonline2021/v0.0.14',
  },
}

export const networkIds = () =>
  Object.keys(networks).map((key) => Number(key))

export default networks
