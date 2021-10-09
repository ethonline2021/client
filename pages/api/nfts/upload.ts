import formidable from 'formidable'
import fs from 'fs'
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

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const storage = new Web3Storage({
    token: process.env.WEB3_STORAGE_API_KEY,
  })

  const form = new formidable.IncomingForm()

  const result = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)

      resolve({
        err,
        fields,
        files,
      })
    })
  })

  let image = null
  if (result.files.image) {
    image = fs.readFileSync(result.files.image.path)
  }

  const data = {...result.fields}

  const {amount} = data

  if (!amount) {
    res.status(400).json({
      error: 'amount not set',
    })
    return
  }

  const files = []

  // starts by 1 due to how NFT ids work
  for (let i = 1; i <= amount; i++) {
    const nft = {
      id: i,
      ...nftData(data),
    }

    const json = new Blob([JSON.stringify(nft)], {type: 'application/json'})

    files.push(new File([json], `${i}.json`))
  }

  if (image) {
    files.push(new File([image], 'image.png', {
      type: 'image/png',
    }))
  }

  let id : string
  try {
    id = await storage.put(files)
  } catch (e) {
    res.status(400).json(e)
    return
  }

  res.status(200).json({
    id,
    link: process.env.WEB3_STORAGE_NODE?.replace('{id}', id)
  })
}
