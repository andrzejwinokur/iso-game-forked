import * as React from "react"
import { motion } from "framer-motion"
import { useIso, IsoContext } from "../hooks/useIso"
import { useAssets, AssetsContext } from "../hooks/useAssets"
import Scene from "./Scene"
import Loading from "./Loading"

const SCALE = 32
const PADDING = 16
const ANGLE = 45
const ZHEIGHT = 2
const DEPTH_X = 15
const DEPTH_Y = 15
const HEIGHT = 480
const WIDTH = 720
const ASSETS = {
  grass: "grass.png",
  dirt: "dirt.png",
  tile: "tile.png",
  stone: "stone.png",
  water: "water.png",
  step: "step.png",
  path_north: "path_north.png",
  path_south: "path_south.png",
  path_east: "path_east.png",
  path_west: "path_west.png",
  path_northEast: "path_northEast.png",
  path_northWest: "path_northWest.png",
  path_southEast: "path_southEast.png",
  path_southWest: "path_southWest.png"
}
const EMPTY = {}

export type Props = {
  height?: number
  width?: number
}

const Container: React.FC<Props> = ({ height = HEIGHT, width = WIDTH }) => {
  /* --------------------------------- Assets --------------------------------- */

  const [pixelated, setPixelated] = React.useState(false)

  const [showAssets, setShowAssets] = React.useState<Record<string, any>>(
    ASSETS
  )

  const assets = useAssets(showAssets)

  /* --------------------------------- Offsets -------------------------------- */

  const rContainer = React.useRef<HTMLDivElement>(null)

  const [offsets, setOffsets] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const updateOffsets = () => {
      if (rContainer.current) {
        if (
          offsets.x === rContainer.current.offsetLeft &&
          offsets.y === rContainer.current.offsetTop
        ) {
          return
        } else {
          setOffsets({
            x: rContainer.current.offsetLeft,
            y: rContainer.current.offsetTop
          })
        }
      }
    }

    window.addEventListener("resize", updateOffsets)
    updateOffsets()
    return () => window.removeEventListener("resize", updateOffsets)
  })

  /* ----------------------------------- Iso ---------------------------------- */

  const [origin, setOrigin] = React.useState({
    x: width,
    y: SCALE * ZHEIGHT,
    z: 1
  })

  const [angle, setAngle] = React.useState(ANGLE)

  const [scale, setScale] = React.useState(SCALE)

  const iso = useIso(scale, angle, ZHEIGHT, PADDING)

  return (
    <AssetsContext.Provider value={assets}>
      <IsoContext.Provider value={iso}>
        <motion.div
          ref={rContainer}
          style={{
            backgroundColor: "#2e2a2e",
            userSelect: "none"
          }}
        >
          <Scene
            origin={{ x: origin.x, y: origin.y + (45 - angle) * 4, z: 0 }}
            offsets={offsets}
            height={height}
            width={width}
            depthX={DEPTH_X}
            depthY={DEPTH_Y}
            pixelated={pixelated}
          />
        </motion.div>
        <div>
          <div>
            Textures
            <input
              type="checkbox"
              defaultChecked={showAssets === ASSETS}
              onChange={(e) => {
                setShowAssets(e.target.checked ? ASSETS : EMPTY)
              }}
            />
          </div>
          <div>
            Pixelated
            <input
              type="checkbox"
              defaultChecked={pixelated}
              onChange={(e) => {
                setPixelated(e.target.checked)
              }}
            />
          </div>
          <div>
            Camera Height
            <input
              type="range"
              min={"0"}
              max={"90"}
              step={1}
              defaultValue={angle.toString()}
              onChange={(e) => setAngle(parseFloat(e.target.value))}
            />
          </div>
          <div>
            Origin
            <input
              type="range"
              min={"0"}
              max={"480"}
              step={1}
              defaultValue={"240"}
              onChange={(e) =>
                setOrigin({ ...origin, x: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            Scale
            <input
              type="range"
              min={"0"}
              max={"64"}
              step={1}
              defaultValue={"32"}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </IsoContext.Provider>
    </AssetsContext.Provider>
  )
}

export default Container
