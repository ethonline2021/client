import { Card } from 'antd'
import Meta from 'antd/lib/card/Meta'

import { useRouter } from 'next/router'

const Item = ({title, description, address}) => {
  const router = useRouter()

  return (
    <Card 
      onClick={() => router.push(`/items/${address}`)}
      hoverable={true}
      cover={<img alt="example" src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png" />}
      actions={[]}
    >
      <Meta title={title} description={description} />
    </Card>
  )
}

export default Item
