import { createMuiTheme, CssBaseline, ThemeProvider } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import './App.css'
import { FlowNetworkEditor } from './components/FlowNetworkEditor';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#006064',
    },
    secondary: {
      main: '#afb42b',
    },
    background: {
      default: grey[900]
    }
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline>
        <FlowNetworkEditor />
      </CssBaseline>
    </ThemeProvider>
  )
}

export default App