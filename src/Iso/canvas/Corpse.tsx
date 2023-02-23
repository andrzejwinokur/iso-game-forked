import React from "react"
import { pointsToPath, pointsToPolygon, hardStroke } from "../utils"
import Sprite, { DrawCallback } from "./Sprite"

type Props = {
  item: any
  z?: number
  visible?: number
}

const Corpse: React.FC<Props> = ({ item, visible = true }) => {
  const draw = React.useCallback<DrawCallback>(
    (ctx, iso, assets) => {
      const { getVerts, sprite } = iso
      const { color, size } = item

      const {
        rightUp,
        rightDown,
        leftUp,
        frontUp,
        frontDown,
        leftDown,
        backUp
      } = getVerts({
        x: 0.7,
        y: 0.7,
        z: 0.2
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

      ctx.fillStyle = "rgba(0,0,0,.5)"
      ctx.fill(paths.outline)

      // Visible
      if (!visible) {
        ctx.fillStyle = "rgba(0,0,0,.4)"
        ctx.fill(paths.outline)
      }
    },
    [item, visible]
  )

  return <Sprite point={item.point} draw={draw} />
}

export default Corpse
