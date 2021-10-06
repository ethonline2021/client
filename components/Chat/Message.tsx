import { Comment } from "antd"
import styled from "styled-components"

const StyledComment : typeof Comment = styled(Comment)`
  margin: 5px 0;
  .ant-comment-content {
    padding: 10px;
  }
  .ant-comment-inner {
    padding: 0;
  }
  &.others {
    background-color: #b3d1ff;
  }
  &.mine {
    background-color: #a7cac2;
    text-align: right;
    .ant-comment-content-author {
      justify-content: flex-end;
    }
  }
  .ant-comment-content-detail {
    color: #4f4f4f;
  }
  .ant-comment-content-author-name {
    font-weight: bold;
    max-width: 20%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .ant-comment-content-author-time {
    color: white;
  }
`

const Message = ({msg, account}) => {
  let className = 'others'
  let author = msg.account
  if (msg.account === account) {
    className = 'mine'
    author = 'You'
  }

  return <StyledComment
    content={msg.text}
    author={author}
    datetime={msg.timestamp}
    className={className}
  />
}

export default Message
