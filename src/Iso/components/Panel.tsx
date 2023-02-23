import React from "react"

export interface Props {}

const Panel: React.FC<Props> = props => {
  return (
    <div
      style={{
        height: 128,
        backgroundColor: "#2e2a2e",
        border: "1px solid #000000"
      }}
    ></div>
  )
}

export default Panel
