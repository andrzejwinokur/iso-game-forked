import React from "react"
import { Stance, Item } from "../types"
import { pointsToPath, pointsToPolygon, hardStroke } from "../utils"
import { Transition } from "framer-motion"
import MovingSprite, { DrawCallback } from "./MovingSprite"

type Props = {
  item: Item & Record<string, any>
  visible?: number
  transition?: Transition
  onAnimationComplete?: () => void
  targeted?: boolean
}

const Block: React.FC<Props> = ({
  item,
  transition,
  onAnimationComplete,
  targeted = false,
  visible = 1
}) => {
  const draw = React.useCallback<DrawCallback>(
    (ctx, iso, assets) => {
      const { sprite, getVerts } = iso
      const { color, size, stance } = item

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
      ctx.translate(iso.sprite.origin.x, iso.sprite.origin.y)

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

      // Health

      if (item.health) {
        ctx.resetTransform()
        ctx.save()
        const barFrame = {
          x: 24,
          y: sprite.origin.y + backUp.y - 16,
          height: 8,
          width: sprite.width - 48
        }

        const healthOuter = new Path2D()
        healthOuter.rect(
          barFrame.x,
          barFrame.y,
          barFrame.width,
          barFrame.height
        )
        ctx.fillStyle = "#e6492f"
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 1
        ctx.fill(healthOuter)

        const remaining = item.health.current / item.health.max
        const healthInner = new Path2D()

        healthInner.rect(
          barFrame.x,
          barFrame.y,
          barFrame.width * remaining,
          barFrame.height
        )

        ctx.fillStyle =
          remaining > 0.5 ? "#71ab34" : remaining > 0.3 ? "#f4b41d" : "#f57e1c"
        ctx.fill(healthInner)

        hardStroke(ctx, healthInner)
        hardStroke(ctx, healthOuter)
        ctx.restore()
      }

      // Visible
      if (visible !== undefined) {
        ctx.translate(iso.sprite.origin.x, iso.sprite.origin.y)
        ctx.fillStyle = `rgba(2,0,4,${(1 - visible) * 0.7})`
        ctx.fill(paths.outline)
      }
    },
    [item, visible]
  )

  return (
    <MovingSprite
      point={item.point}
      draw={draw}
      transition={transition}
      onAnimationComplete={onAnimationComplete}
    />
  )
}

export default Block
