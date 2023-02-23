import React from "react"
import Block from "./Block"
import MovingBlock from "./MovingBlock"
import Tiles from "./Tiles"
import Cursor from "./Cursor"
import Step from "./Step"
import Shot from "./Shot"
import Corpse from "./Corpse"
import Reticle from "./Reticle"
import { motion } from "framer-motion"
import { Path, Point, Item, Bullet } from "../types"
import { isDiagonal } from "../utils"

export interface Props {
  height: number
  width: number
  originX: number
  originY: number
  tiles: any
  blocking?: any
  hoveredTile?: Item
  hoveredEntity?: Item
  selectedEntity?: Item
  target?: Item
  path: Path
  bullets: Bullet[]
  vision?: number[][]
  onAnimationComplete: (id: string) => void
}

const View: React.FC<Props> = ({
  height,
  width,
  originX,
  originY,
  tiles,
  blocking,
  hoveredTile,
  hoveredEntity,
  bullets,
  selectedEntity,
  onAnimationComplete,
  path,
  target,
  vision
}) => {
  const inVision = React.useCallback(
    (point: Point) => {
      if (!vision) return 1
      return vision[point.y][point.x]
    },
    [vision]
  )

  const blockingShapes = React.useMemo(() => {
    if (!blocking) return
    return Object.values(blocking.items)
      .filter((item: any) => item.type !== "character")
      .map((item: any) => (
        <Block key={item.id} item={item} visible={inVision(item.point)} />
      ))
  }, [blocking, inVision])

  const movingEntityShapes = React.useMemo(() => {
    if (!blocking) return
    return Object.values(blocking.items)
      .filter((item: any) => item.type === "character")
      .map((item: any) =>
        item.dead ? (
          <Corpse key={item.id} item={item} visible={inVision(item.point)} />
        ) : (
          <MovingBlock
            key={item.id}
            item={item}
            visible={inVision(item.point)}
            transition={{
              ease: "linear",
              duration: isDiagonal(item.direction) ? 0.41 : 0.25,
              delay: 0.1
            }}
            onAnimationComplete={() => onAnimationComplete(item.id)}
          />
        )
      )
  }, [blocking, onAnimationComplete, inVision])

  const entityShapes = React.useMemo(() => {
    if (!blocking) return
    return Object.values(blocking.items)
      .filter((item: any) => item.type === "character")
      .map((item: any) =>
        item.dead ? (
          <Corpse key={item.id} item={item} visible={inVision(item.point)} />
        ) : (
          <MovingBlock
            key={item.id}
            item={item}
            visible={inVision(item.point)}
            transition={{
              ease: "linear",
              duration: isDiagonal(item.direction) ? 0.41 : 0.25,
              delay: 0.1
            }}
          />
        )
      )
  }, [blocking, inVision])

  const bulletShapes = React.useMemo(() => {
    return bullets.map((bullet, i) => <Shot key={i} {...bullet} />)
  }, [bullets])

  const pathShapes = React.useMemo(
    () =>
      path &&
      path.map((step, i: number) => (
        <Step key={i} point={step.to} direction={step.direction} color="#000" />
      )),
    [path]
  )

  return (
    <motion.div style={{ x: width / 2, y: 64, position: "relative" }}>
      <div style={{ position: "relative", zIndex: -1 }}>
        <Tiles
          key={"tiles"}
          tiles={tiles.items}
          vision={vision}
          width={width}
          height={height}
          originX={originX}
          originY={originY}
        />
      </div>
      <div style={{ position: "relative", zIndex: 0 }}>
        {pathShapes}
        {hoveredTile && <Cursor point={hoveredTile.point} color={"#f4b41a"} />}
        {selectedEntity && (
          <Cursor point={selectedEntity.point} color={"#e6492d"} />
        )}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        {target && <Reticle {...target} chanceToHit={1} />}
        {movingEntityShapes}
        {blockingShapes}
        {bulletShapes}
      </div>
      <div style={{ position: "relative", opacity: 0.25, zIndex: 2 }}>
        {entityShapes}
        {hoveredTile && <Cursor point={hoveredTile.point} color={"#f4b41a"} />}
        {selectedEntity && (
          <Cursor point={selectedEntity.point} color={"#e6492d"} />
        )}
        {pathShapes}
      </div>
      <div style={{ position: "relative", opacity: 0.5, zIndex: 3 }}></div>
    </motion.div>
  )
}

export default View
