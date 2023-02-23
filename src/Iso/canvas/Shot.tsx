import React from "react"
import { motion, AnimationControls, useMotionValue } from "framer-motion"
import { hardStroke } from "../utils"
import { useIsoContext } from "../hooks/useIso"
import { useAssetsContext } from "../hooks/useAssets"
import { DrawCallback } from "./MovingSprite"

type Props = {
  id: string
  animation: AnimationControls
  border?: boolean
}

const draw: DrawCallback = (ctx, iso) => {
  const { sprite } = iso

  ctx.resetTransform()
  ctx.clearRect(0, 0, sprite.width, sprite.height)

  const bullet = new Path2D()
  bullet.ellipse(sprite.origin.x, sprite.origin.y, 2, 2, 0, 0, Math.PI * 2)

  ctx.fillStyle = "#FFF"
  ctx.fill(bullet)
  hardStroke(ctx, bullet)
}

const Shot: React.FC<Props> = ({ id, animation, border }) => {
  const iso = useIsoContext()
  const assets = useAssetsContext()

  const mvy = useMotionValue(0)

  const rCanvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (rCanvas.current) {
      const ctx = rCanvas.current.getContext("2d")
      if (!ctx) return
      draw(ctx, iso, assets)
    }
  }, [iso, assets])

  React.useEffect(() => {
    animation.mount()
    animation.set({ x: -999, y: -999 })
    return () => {
      animation.unmount()
    }
  }, [animation])

  return (
    <motion.div
      animate={animation}
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        y: mvy,
        zIndex: mvy,
        width: iso.sprite.width,
        height: iso.sprite.height,
        border: border ? "1px solid #ccc" : ""
      }}
    >
      <canvas
        ref={rCanvas}
        width={iso.sprite.width}
        height={iso.sprite.height}
      />
    </motion.div>
  )
}

export default Shot
