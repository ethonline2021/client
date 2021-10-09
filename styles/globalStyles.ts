import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle`
  /* Using this inherit reset method means you can use content-box or padding-box without a universal selector overriding your CSS */
  html {
    box-sizing: border-box;
  }
  /* Only using * omits pseudo elements so specifically include these  */
  * , *:before, *:after {
    box-sizing: inherit;
    font-family: Roboto, Arial, sans-serif;
  }

  .ant-card-cover{
    height:230px;
    overflow:hidden;
  }

  .homesponsorimg {
    height:50px;
    margin-right:50px;
    margin-bottom:20px;
  }
`

export default GlobalStyle
