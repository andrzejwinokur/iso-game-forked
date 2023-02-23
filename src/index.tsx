import * as React from "react"
import { render } from "react-dom"
import Container from "./Iso/components/Container"
import "./styles.css"

function App() {
  return (
    <div className="App">
      <Container />
      {/* <Drawing /> */}
    </div>
  )
}

const rootElement = document.getElementById("root")
render(<App />, rootElement)
