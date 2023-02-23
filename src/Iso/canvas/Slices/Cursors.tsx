import React from "react"
import { Tile, Character } from "../../types"
import Cursor from "../Cursor"

export interface Props {
  hoveredTile?: Tile
  selectedCharacter?: Character
}

const Cursors: React.FC<Props> = ({ hoveredTile, selectedCharacter }) => {
  return (
    <>
      {hoveredTile && <Cursor point={hoveredTile.point} color={"#f4b41a"} />}
      {selectedCharacter && (
        <Cursor point={selectedCharacter.point} color={"#e6492d"} />
      )}
    </>
  )
}

export default Cursors
