import type { NextApiRequest, NextApiResponse } from 'next'
import { Web3Storage, getFilesFromPath, File, Blob } from 'web3.storage'
import { Item } from '../../../types'

type NFTData = Pick<Item, "title" | "description" | "price">

const nftData = (values: Item) : NFTData => {
  return {
    title: values.title,
    description: values.description,
    price: values.price,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const storage = new Web3Storage({
    token: process.env.WEB3_STORAGE_API_KEY,
  })

  const {amount} = req.body as Item

  if (!amount) {
    res.status(400).json({
      error: 'amount not set',
    })
    return
  }

  const files = []

  for (let i = 0; i < amount; i++) {
    const nft = {
      id: i,
      ...nftData(req.body),
    }

    const json = new Blob([JSON.stringify(nft)], {type: 'application/json'})

    files.push(new File([json], `${i}.json`))
  }

  const id = await storage.put(files)

  res.status(200).json({
    id,
    link: process.env.WEB3_STORAGE_NODE?.replace('{id}', id)
  })
}
