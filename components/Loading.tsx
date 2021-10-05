import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { ReactNode } from "react"
import styled from "styled-components"


const Loading = ({loading, children} : {loading: boolean, children: ReactNode}) => {
  const Wrapper = styled.div`
    &.loading {
      display: flex;
      justify-content: center;
      justify-items: center;
      > span.loader {
        display: inline-block;
      }

      > div {
        display: none;
      }
    }

    > span.loader {
      display: none;
    }

    > div {
      display: flex;
      flex-direction: column;
    }
  `

  return (
    <Wrapper className={loading && 'loading'}>
      <span className='loader'>
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 24 }} spin />
          }
        />
      </span>
      <div>
        {children}
      </div>
    </Wrapper>
  )
}

export default Loading
