import React from "react"
import { Path } from "../../types"
import Step from "../Step"

export interface Props {
  path: Path
}

const Steps: React.FC<Props> = ({ path }) => {
  return (
    <>
      {path.map((step, i: number) => (
        <Step key={i} point={step.to} direction={step.direction} color="#000" />
      ))}
    </>
  )
}

export default Steps
