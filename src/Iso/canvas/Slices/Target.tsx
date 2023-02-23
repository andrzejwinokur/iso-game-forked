import React from "react"
import { Character } from "../../types"
import Reticle from "../Reticle"

export interface Props {
  target?: Character
}

const Target: React.FC<Props> = ({ target }) => {
  return <>{target && <Reticle {...target} chanceToHit={1} />}</>
}

export default Target
