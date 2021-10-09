import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'

type Data = {
  name: string
}

const config = {
  headers: {
    Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
  },
}

const livepeer = axios.create({
  baseURL: 'https://livepeer.com/api',
  headers: config.headers,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!req.query.id) {
    res.status(400).json({
      error: 'missing id',
    })
    return
  }

  let result : any

  let stream : AxiosResponse
  try {
    stream = await livepeer.get('/stream', {
      params: {
        streamsonly: true,
        filters: JSON.stringify([
          {
            id: 'name',
            value: req.query.id,
          }
        ]),
      }
    })
  } catch (e) {
    res.status(500).json(e)
    return
  }

  if (!stream.data.length) {
    try {
      stream = await livepeer.post('/stream', {
        name: req.query.id,
        profiles: [{
          name: "720p",
          bitrate: 2000000,
          fps: 30,
          width: 1280,
          height: 720,
        }]
      })
      result = stream.data
    } catch (e) {
      res.status(500).json(e)
      return
    }
  } else {
    result = stream.data.pop()
  }

  const response = {
    rtmp: 'rtmp://rtmp.livepeer.com/live/',
    streamKey: result.streamKey,
    playbackUrl: `https://cdn.livepeer.com/hls/${result.playbackId}/index.m3u8`,
    active: result.isActive,
  }

  res.status(200).json(response)
}
