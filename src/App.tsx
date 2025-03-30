import React from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { theme } from "./theme";
import MusTinApp from "./components/MusTinApp";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  
  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: fixed;
    touch-action: manipulation;
    user-select: none;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Roboto', sans-serif;
    background: ${({ theme }) => theme.colors.backgroundGradient};
    color: ${({ theme }) => theme.colors.text};
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Prevent pull-to-refresh and overscroll behavior */
  body {
    overscroll-behavior: none;
  }

  /* Hide scrollbars but allow scrolling in components that need it */
  ::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
`;

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <MusTinApp />
    </ThemeProvider>
  );
};

export default App;
