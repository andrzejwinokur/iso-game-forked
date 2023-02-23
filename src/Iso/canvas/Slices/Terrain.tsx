import React from "react"
import { Terrain as T } from "../../types"
import Block from "../Block"

export interface Props {
  terrain: T[]
  vision?: number[][]
}

const Terrain: React.FC<Props> = ({ terrain, vision }) => {
  return (
    <>
      {terrain.map(item => (
        <Block
          key={item.id}
          item={item}
          visible={vision ? vision[item.point.y][item.point.x] : 1}
        />
      ))}
    </>
  )
}

export default Terrain
