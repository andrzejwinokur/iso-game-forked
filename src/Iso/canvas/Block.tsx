import React from "react"
import { Stance } from "../types"
import { pointsToPath, pointsToPolygon, hardStroke } from "../utils"
import Sprite, { DrawCallback } from "./Sprite"

type Props = {
  item: any
  z?: number
  visible?: number
  edged?: boolean
}

const Block: React.FC<Props> = ({ item, visible, edged = true }) => {
  const draw = React.useCallback<DrawCallback>(
    (ctx, iso, assets) => {
      const { getVerts, sprite } = iso
      const { color, size, adjacent, stance } = item
      const { north, south, east, west } = adjacent

      const {
        rightUp,
        rightDown,
        leftUp,
        frontUp,
        frontDown,
        leftDown,
        backUp
      } = getVerts({
        ...size,
        z: stance === Stance.Crouch ? size.z - 0.5 : size.z
      })

      const paths = {
        southFace: pointsToPolygon(frontDown, leftDown, leftUp, frontUp),
        eastFace: pointsToPolygon(frontDown, frontUp, rightUp, rightDown),
        topFace: pointsToPolygon(frontUp, leftUp, backUp, rightUp),
        northEdge: pointsToPath(backUp, rightUp),
        eastEdge: pointsToPath(rightDown, frontDown),
        southEdge: pointsToPath(frontDown, leftDown),
        westEdge: pointsToPath(leftUp, backUp),
        northEastEdge: pointsToPath(rightUp, rightDown),
        southWestEdge: pointsToPath(leftUp, leftDown),
        inline: pointsToPath(frontDown, frontUp, leftUp, frontUp, rightUp),
        outline: pointsToPath(
          frontDown,
          leftDown,
          leftUp,
          backUp,
          rightUp,
          rightDown,
          frontDown
        )
      }

      ctx.resetTransform()
      ctx.clearRect(0, 0, sprite.width, sprite.height)

      // Block
      ctx.translate(sprite.origin.x, sprite.origin.y)

      // South face
      ctx.fillStyle = color
      ctx.fill(paths.southFace)

      // East face
      ctx.fillStyle = color
      ctx.fill(paths.eastFace)

      // Top face
      ctx.fillStyle = color
      ctx.fill(paths.topFace)

      if (assets && item.texture && assets[item.texture]) {
        const texture = assets[item.texture]
        const { leftToRight, backToFront, downToUp } = iso.dimensions

        ctx.globalAlpha = 0.5
        ctx.save()
        ctx.clip(paths.southFace)
        ctx.transform(1, 0.5, 0, 1.2, 0, backToFront / 2)
        ctx.drawImage(
          texture,
          0,
          0,
          64,
          64,
          leftUp.x,
          leftUp.y,
          leftToRight,
          downToUp * size.z
        )
        ctx.restore()

        ctx.save()
        ctx.clip(paths.southFace)
        ctx.transform(1, 0.5, 0, 1.2, 0, backToFront / 2)
        ctx.drawImage(
          texture,
          0,
          0,
          64,
          64,
          leftUp.x,
          leftUp.y,
          leftToRight,
          downToUp * size.z
        )
        ctx.restore()

        ctx.save()
        ctx.clip(paths.eastFace)
        ctx.transform(1, -0.5, 0, 1.2, 0, backToFront / 2)
        ctx.drawImage(
          texture,
          0,
          0,
          64,
          64,
          leftUp.x,
          leftUp.y,
          leftToRight,
          downToUp * size.z
        )
        ctx.restore()

        ctx.save()
        ctx.clip(paths.topFace)
        ctx.transform(1, -(downToUp / leftToRight), 1, 0.5, 0, 0)
        ctx.drawImage(
          texture,
          0,
          0,
          64,
          64,
          leftUp.x + leftToRight * (size.z - 1) + 3,
          backUp.y + 3,
          leftToRight,
          backToFront
        )
        ctx.restore()
        ctx.globalAlpha = 1
      }

      // Lighting
      ctx.fillStyle = "rgba(0,0,0,.32)"
      ctx.fill(paths.eastFace)

      ctx.fillStyle = "rgba(255, 255, 255,.1)"
      ctx.fill(paths.topFace)

      // Inner edges
      ctx.beginPath()
      ctx.strokeStyle = color
      hardStroke(ctx, paths.inline)
      ctx.strokeStyle = "rgba(255, 255, 255, .1)"
      hardStroke(ctx, paths.inline)

      // Outline
      ctx.strokeStyle = color
      hardStroke(ctx, paths.outline)
      ctx.strokeStyle = "rgba(0, 0, 0, .24)"
      hardStroke(ctx, paths.outline)

      // Outside edges
      if (edged) {
        const edge = new Path2D()
        !north && edge.addPath(paths.northEdge)
        !east && edge.addPath(paths.eastEdge)
        !south && edge.addPath(paths.southEdge)
        !west && edge.addPath(paths.westEdge)
        !north && !east && edge.addPath(paths.northEastEdge)
        !south && !west && edge.addPath(paths.southWestEdge)
        ctx.strokeStyle = color
        hardStroke(ctx, edge)
        ctx.strokeStyle = "rgba(0,0,0,.5)"
        hardStroke(ctx, edge)
      }

      // Visible
      if (visible !== undefined) {
        ctx.fillStyle = `rgba(2,0,4,${(1 - visible) * 0.7})`
        ctx.fill(paths.outline)
      }
    },
    [item, edged, visible]
  )

  return <Sprite point={item.point} draw={draw} />
}

export default Block
