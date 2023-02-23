import React from "react"
import { Bullet as T } from "../../types"
import Shot from "../Shot"

export interface Props {
  bullets: T[]
}

const Cursors: React.FC<Props> = ({ bullets }) => {
  return (
    <>
      {bullets.map((bullet, i) => (
        <Shot key={i} {...bullet} />
      ))}
    </>
  )
}

export default Cursors
