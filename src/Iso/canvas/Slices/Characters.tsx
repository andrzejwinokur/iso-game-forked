import React from "react"
import { Character as T } from "../../types"
import { isDiagonal } from "../../utils"
import MovingBlock from "../MovingBlock"
import Corpse from "../Corpse"

export interface Props {
  characters: T[]
  vision?: number[][]
  onAnimationComplete?: (id: string) => void
}

const Characters: React.FC<Props> = ({
  characters,
  onAnimationComplete,
  vision
}) => {
  return (
    <>
      {characters.map((item: any) =>
        item.dead ? (
          <Corpse key={item.id} item={item} visible={1} />
        ) : (
          <MovingBlock
            key={item.id}
            item={item}
            visible={vision ? vision[item.point.y][item.point.x] : 1}
            transition={{
              ease: "linear",
              duration: isDiagonal(item.direction) ? 0.41 : 0.25,
              delay: 0.1
            }}
            onAnimationComplete={() =>
              onAnimationComplete && onAnimationComplete(item.id)
            }
          />
        )
      )}
    </>
  )
}

export default Characters
