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
`

export default GlobalStyle
