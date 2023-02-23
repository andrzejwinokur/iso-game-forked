import React from "react"
import { useAssetsContext } from "../hooks/useAssets"
import { pointsToPath, pointsToPolygon, hardStroke } from "../utils"
import { useIsoContext } from "../hooks/useIso"

type TilesProps = {
  tiles: any[]
  originX: number
  originY: number
  width: number
  height: number
  vision?: number[][]
}

const Tiles: React.FC<TilesProps> = ({
  originX,
  originY,
  height,
  width,
  tiles,
  vision
}) => {
  const iso = useIsoContext()
  const assets = useAssetsContext()

  const rCanvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (rCanvas.current) {
      const ctx = rCanvas.current.getContext("2d")
      if (!ctx) return

      const { getVerts, getSpriteFrame } = iso

      ctx.resetTransform()
      ctx.clearRect(0, 0, width * 2, height * 2)
      ctx.translate(originX, originY)

      for (let item of Object.values(tiles)) {
        const { point, color, size, adjacent } = item
        const { north, south, east, west } = adjacent

        const { x, y, origin } = getSpriteFrame({ ...point, z: -0.5 })

        const {
          rightUp,
          rightDown,
          leftUp,
          frontUp,
          frontDown,
          leftDown,
          backUp
        } = getVerts(size)

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
        ctx.translate(originX, originY)
        ctx.translate(x + origin.x, y + origin.y)

        // South face
        ctx.fillStyle = color
        ctx.fill(paths.southFace)

        // East face
        ctx.fillStyle = color
        ctx.fill(paths.eastFace)

        // Top face
        ctx.fillStyle = color
        ctx.fill(paths.topFace)

        // Textures
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
            leftUp.x,
            backUp.y,
            leftToRight,
            backToFront
          )
          ctx.restore()
          ctx.globalAlpha = 1
        }

        // Lighting
        ctx.fillStyle = "rgba(0,0,0,.32)"
        ctx.fill(paths.eastFace)

        ctx.fillStyle = "rgba(0,0,0,.1)"
        ctx.fill(paths.southFace)

        // Inner edges
        ctx.beginPath()
        ctx.strokeStyle = color
        hardStroke(ctx, paths.inline)
        ctx.strokeStyle = "rgba(255, 255, 255, .1)"
        hardStroke(ctx, paths.inline)

        // Outline
        ctx.strokeStyle = color
        hardStroke(ctx, paths.outline)
        ctx.strokeStyle = "rgba(0, 0, 0, .12)"
        hardStroke(ctx, paths.outline)

        // Outside edges

        const edge = new Path2D()
        !north && edge.addPath(paths.northEdge)
        !east && edge.addPath(paths.eastEdge)
        !south && edge.addPath(paths.southEdge)
        !west && edge.addPath(paths.westEdge)
        !north && !east && edge.addPath(paths.northEastEdge)
        !south && !west && edge.addPath(paths.southWestEdge)

        ctx.strokeStyle = color
        hardStroke(ctx, edge)
        ctx.strokeStyle = "rgba(0,0,0,.35)"
        hardStroke(ctx, edge)

        // Vision

        if (vision) {
          const tileVisibility = vision[item.point.y][item.point.x]
          ctx.fillStyle = `rgba(2,0,4,${(1 - tileVisibility) * 0.7})`
          ctx.fill(paths.outline)
        }
      }
    }
  }, [iso, originX, originY, height, width, tiles, assets, vision])

  return (
    <canvas
      ref={rCanvas}
      width={width * 2}
      height={height * 2}
      style={{
        position: "absolute",
        top: -originY,
        left: -originX,
        zIndex: 0
      }}
    />
  )
}

export default Tiles
