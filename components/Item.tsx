import Link from 'next/link'
import styled from 'styled-components'

const Item = ({title, description, address}) => {
  const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
  `

  const P = styled.p`
    flex: 1;
  `

  return (
    <Wrapper>
      <div>
        <Link href={`/items/${address}`}>
          <a>{title}</a>
        </Link>
      </div>
      <P>{description}</P>
    </Wrapper>
  )
}

export default Item
