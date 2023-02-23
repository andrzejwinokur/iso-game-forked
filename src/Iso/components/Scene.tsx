import React from "react"
import { uniqueId, random, range, partition } from "lodash"
import {
  Bullets,
  Characters,
  Cursors,
  Steps,
  Target,
  Terrain as TerrainSlice
} from "../canvas/Slices"
import { subtractPoints, multiplyPoints, hitTest3d } from "../utils"
import {
  Direction,
  Point,
  Point3,
  Path,
  Stance,
  Tile,
  TileOptions,
  Character,
  CharacterOptions,
  Terrain,
  TerrainOptions,
  Blocker
} from "../types"
import Tiles from "../canvas/Tiles"
import { useTileLayer } from "../hooks/useTileLayer"
import { useBlockingLayer } from "../hooks/useBlockingLayer"
import { useKeyboard } from "../hooks/useKeyboard"
import { usePath } from "../hooks/usePath"
import { useRaycaster } from "../hooks/useRaycaster"
import { useIsoContext } from "../hooks/useIso"
import Panel from "./Panel"
import { motion, useMotionValue, AnimationControls } from "framer-motion"

export interface Props {
  height: number
  width: number
  depthX: number
  depthY: number
  origin: Point3
  offsets: Point
  pixelated: boolean
}

const Scene2: React.FC<Props> = ({
  height,
  width,
  depthX,
  depthY,
  origin,
  offsets,
  pixelated
}) => {
  const iso = useIsoContext()

  const { screenToSpace } = iso

  /* --------------------------------- Layers --------------------------------- */

  const tiles = useTileLayer(depthX, depthY, tileFactory)

  const blocking = useBlockingLayer(depthX, depthY, blockingFactory)

  const bullets = React.useMemo(
    () =>
      range(10).map(() => ({
        id: uniqueId(),
        animation: new AnimationControls()
      })),
    []
  )

  const bulletIndex = React.useRef(0)

  const [characters, terrain] = React.useMemo(() => {
    return partition(blocking.array, item => item.type === "character") as [
      Character[],
      Terrain[]
    ]
  }, [blocking])

  /* ---------------------------------- State --------------------------------- */

  const [hoveredTileId, setHoveredTileId] = React.useState<string | undefined>()

  const [hoveredCharacterId, setHoveredCharacterId] = React.useState<
    string | undefined
  >()

  const [selectedCharacterId, setSelectedCharacterId] = React.useState<
    string | undefined
  >()

  const [animatingStates, setAnimatingStates] = React.useState<{
    [key: string]: Path
  }>({})

  /* ---------------------------------- Items --------------------------------- */

  const hoveredTile = React.useMemo(
    () => (hoveredTileId ? tiles.items[hoveredTileId] : undefined),
    [tiles, hoveredTileId]
  )

  const hoveredCharacter = React.useMemo(() => {
    if (hoveredCharacterId) {
      const item = blocking.items[hoveredCharacterId]
      if (item.type === "character") {
        if (item.dead) return
        return item
      }
    }
  }, [blocking, hoveredCharacterId])

  const selectedCharacter = React.useMemo(() => {
    if (selectedCharacterId) {
      const item = blocking.items[selectedCharacterId]
      if (item.type === "character") {
        return item
      }
    }
  }, [blocking, selectedCharacterId])

  const targetedCharacter = React.useMemo(() => {
    if (selectedCharacter && hoveredCharacter) {
      if (selectedCharacter === hoveredCharacter) return

      const { x, y } = hoveredCharacter.point
      if (selectedCharacter.vision[y][x]) {
        return hoveredCharacter
      }
    }
  }, [selectedCharacter, hoveredCharacter])

  /* ---------------------------------- Path ---------------------------------- */

  const pathGrid = React.useMemo(() => {
    return tiles.positions.map((row, y) =>
      row.map((position, x) => {
        const blocker = blocking.getItem(x, y)
        return position.content &&
          position.content.walkable &&
          (!blocker || blocker.dead)
          ? 0
          : 1
      })
    )
  }, [tiles, blocking])

  const { path, setPath, search } = usePath(pathGrid, 0, {
    cornerCutting: false,
    diagonal: true
  })

  React.useEffect(() => {
    if (!(selectedCharacter && hoveredTile) && path.length > 0) {
      setPath(() => [])
    }
  }, [selectedCharacter, hoveredTile, path, setPath])

  /* --------------------------------- Offsets -------------------------------- */

  const mvx = useMotionValue(0)

  const mvy = useMotionValue(0)

  /* ------------------------------- Movement ------------------------------- */

  const moveCharacter = React.useCallback(
    (id: string, path: Path) => {
      const entity = blocking.items[id]
      if (!entity) return

      let step = path.shift()
      if (!step) return

      blocking.dispatch({
        type: "MOVE",
        payload: step
      })

      setAnimatingStates(animatingStates => ({
        ...animatingStates,
        [id]: path
      }))
    },
    [blocking]
  )

  const handleAnimationComplete = React.useCallback(
    (id: string) => {
      if (!animatingStates[id]) return

      if (animatingStates[id].length === 0) {
        setAnimatingStates(animatingStates => {
          delete animatingStates[id]
          return animatingStates
        })
      } else {
        moveCharacter(id, animatingStates[id])
      }
    },
    [setAnimatingStates, animatingStates, moveCharacter]
  )

  /* --------------------------------- Attack --------------------------------- */

  const shoot = React.useCallback(
    async (from: Point, to: Point, miss: boolean) => {
      const index = (bulletIndex.current += 1) % bullets.length
      const bullet = bullets[index]
      const { getSpriteFrame } = iso

      let target = to

      if (miss) {
        target = multiplyPoints(subtractPoints(to, from), {
          x: Math.random(),
          y: Math.random(),
          z: Math.random()
        })
      }
      const fromFrame = getSpriteFrame(from)
      const toFrame = getSpriteFrame(target)

      const distance = Math.hypot(target.x - from.x, target.y - from.y)

      bullet.animation.set({
        x: fromFrame.x,
        y: fromFrame.y,
        opacity: 1
      })

      await bullet.animation.start({
        x: toFrame.x,
        y: toFrame.y,
        opacity: 1,
        transition: {
          duration: distance * 0.05,
          ease: "linear"
        }
      })

      bullet.animation.set({
        x: -999,
        y: -999,
        opacity: 0
      })
    },
    [bullets, iso]
  )

  const attackCharacter = React.useCallback(
    async (attackingId: string, targetId: string, miss: boolean) => {
      const attacking = blocking.items[attackingId]
      if (attacking.type !== "character") return

      const target = blocking.items[targetId]

      if (!attacking) {
        throw Error("Tried to attack from an empty entity")
      }

      if (!attacking.damage) {
        throw Error("Tried to attack from an entity without a damage stat")
      }

      if (!target) {
        throw Error("Tried to attack against an empty entity")
      }

      await shoot(
        { ...attacking.point, z: attacking.size.z - 1 },
        {
          x: target.point.x,
          y: target.point.y,
          z: target.size.z - 1
        },
        miss
      )

      if (miss) return
      if (!attacking) {
        throw Error("After shooting, tried to attack from an empty entity")
      }

      if (!attacking.damage) {
        throw Error(
          "After shooting, tried to attack from an entity without a damage stat"
        )
      }

      if (!attacking.accuracy) {
        throw Error(
          "After shooting, tried to attack from an entity without an accuracy stat"
        )
      }

      if (!target) {
        throw Error("After shooting, tried to attack against an empty entity")
      }

      const damage = random(attacking.damage.min, attacking.damage.max)
      const newHealth = target.health.current - damage

      blocking.dispatch({
        type: "UPDATE",
        payload: [
          {
            point: attacking.point,
            change: {}
          },
          {
            point: target.point,
            change: {
              health: {
                ...target.health,
                current: newHealth
              },
              dead: newHealth <= 0
            }
          }
        ]
      })
    },
    [blocking, shoot]
  )
  /* --------------------------------- Events --------------------------------- */

  const actions = React.useMemo(
    () => ({
      w: () => console.log(selectedCharacter),
      c: () => {
        if (selectedCharacter) {
          if (selectedCharacter.stance === Stance.Stand) {
            blocking.dispatch({
              type: "UPDATE",
              payload: [
                {
                  point: selectedCharacter.point,
                  change: { stance: Stance.Crouch }
                }
              ]
            })
          } else {
            blocking.dispatch({
              type: "UPDATE",
              payload: [
                {
                  point: selectedCharacter.point,
                  change: { stance: Stance.Stand }
                }
              ]
            })
          }
        }
      }
    }),
    [selectedCharacter, blocking]
  )

  useKeyboard(actions)

  const handleCharacterAnimationComplete = React.useCallback((id: string) => {},
  [])

  const handleClick = React.useCallback(() => {
    if (selectedCharacter) {
      if (hoveredCharacter && hoveredCharacter === selectedCharacter) {
        setSelectedCharacterId(undefined)
      } else if (targetedCharacter) {
        if (!selectedCharacter.accuracy) return
        attackCharacter(
          selectedCharacter.id,
          targetedCharacter.id,
          Math.random() > 0.5
        )
      } else if (hoveredTile) {
        moveCharacter(selectedCharacter.id, path.slice(1))
      }
    } else if (hoveredCharacter && hoveredCharacter.type === "character") {
      setSelectedCharacterId(hoveredCharacter.id)
    }
  }, [
    // attackCharacter,
    hoveredTile,
    hoveredCharacter,
    selectedCharacter,
    targetedCharacter,
    path
    // moveCharacter
  ])

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement | SVGSVGElement, MouseEvent>) => {
      const { x, y } = screenToSpace({
        x: e.pageX - origin.x / 2 - offsets.x - mvx.get(),
        y: e.pageY - origin.y - offsets.y - mvy.get(),
        z: 0
      })

      const tile = tiles.getItem(x, y)

      if (tile) {
        if (hoveredTileId && tile.id === hoveredTileId) return
        setHoveredTileId(tile.id)
        if (selectedCharacter) {
          search(selectedCharacter.point, tiles.items[tile.id].point)
        }
      } else {
        setHoveredTileId(undefined)
      }

      const character = blocking.getItem(x, y)

      if (character && !character.dead) {
        if (hoveredCharacterId && character.id === hoveredCharacterId) return
        setHoveredCharacterId(character.id)
      } else {
        setHoveredCharacterId(undefined)
      }
    },
    [
      mvx,
      mvy,
      selectedCharacter,
      hoveredCharacterId,
      screenToSpace,
      tiles,
      hoveredTileId,
      blocking,
      origin,
      offsets,
      search
    ]
  )

  /* ----------------------------------- JSX ---------------------------------- */
  const vision = React.useMemo(() => {
    return selectedCharacter && selectedCharacter.vision
  }, [selectedCharacter])

  return (
    <div>
      <div
        style={{
          position: "relative",
          height,
          width,
          overflow: "hidden",
          border: "1px solid #000",
          borderBottom: "0"
        }}
      >
        <motion.div
          style={{
            position: "relative",
            height: height,
            width: width,
            x: mvx,
            y: mvy,
            imageRendering: pixelated ? "pixelated" : "auto"
          }}
          drag
          onClick={handleClick}
          onMouseMove={handleMouseMove}
        >
          <motion.div style={{ x: width / 2, y: 64, position: "relative" }}>
            <Tiles
              height={height}
              width={width}
              originX={origin.x}
              originY={origin.y}
              tiles={tiles.array}
              vision={vision}
            />
            <div style={{ position: "relative", zIndex: 0 }}>
              <Steps path={path} />
              <Cursors
                hoveredTile={hoveredTile}
                selectedCharacter={selectedCharacter}
              />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <Target target={targetedCharacter} />
              <Characters
                characters={characters}
                onAnimationComplete={handleAnimationComplete}
                vision={vision}
              />
              <TerrainSlice terrain={terrain} vision={vision} />
              <Bullets bullets={bullets} />
            </div>
            <div style={{ position: "relative", opacity: 0.25, zIndex: 2 }}>
              <Characters characters={characters} vision={vision} />
              <Steps path={path} />
              <Cursors
                hoveredTile={hoveredTile}
                selectedCharacter={selectedCharacter}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Panel />
    </div>
  )
}

export default Scene2

/* -------------------------------- Factories ------------------------------- */

type Legend<T = {}> = { [key: string]: T }

type TileMap<T extends Legend<unknown>, K = keyof T> = ("." | K)[][]

const tilesLegend: Legend<TileOptions> = {
  g: {
    type: "grass",
    texture: "grass",
    color: "#71aa34",
    walkable: true,
    size: { x: 1, y: 1, z: 0.5 }
  },
  d: {
    type: "dirt",
    texture: "dirt",
    color: "#a05b53",
    walkable: true,
    size: { x: 1, y: 1, z: 0.5 }
  },
  t: {
    type: "tile",
    texture: "tile",
    color: "#999",
    walkable: true,
    size: { x: 1, y: 1, z: 0.5 }
  },
  w: {
    type: "water",
    texture: "water",
    color: "#28ccdf",
    walkable: false,
    size: { x: 1, y: 1, z: 0.35 }
  }
}

const tilesMap: TileMap<typeof tilesLegend> = [
  ["g", "g", "g", "d", "w", "w", "w", "d", "d", "t", "w", "w", "d", "d", "t"],
  ["w", "g", "d", "g", "d", "d", "w", "d", "d", "d", "w", "w", "d", "d", "t"],
  ["d", "w", "g", "t", "g", "g", "w", "w", "d", "t", "w", "w", "d", "d", "t"],
  ["g", "g", "d", "g", "d", "g", "d", "w", "d", "t", "t", "t", "g", "d", "t"],
  ["w", "t", "g", "t", "t", "d", "t", "t", "t", "t", "w", "w", "d", "d", "t"],
  ["w", "w", "g", "g", "g", "g", "w", "d", "t", "g", "w", "w", "d", "d", "t"],
  ["w", "w", "d", "t", "g", "g", "w", "w", "d", "g", "w", "w", "g", "d", "t"],
  ["g", "w", "t", "t", "t", "d", "d", "w", "d", "d", "w", "d", "g", "d", "t"],
  ["w", "w", "g", "g", "t", "d", "d", "w", "w", "g", "w", "d", "t", "d", "t"],
  ["w", "d", "g", "t", "d", "t", "d", "w", "w", "d", "d", "t", "t", "d", "t"],
  ["w", "d", "g", "t", "d", "t", "d", "w", "w", "d", "d", "d", "d", "d", "t"],
  ["w", "w", "d", "t", "g", "g", "w", "w", "d", "g", "w", "w", "d", "d", "t"],
  ["g", "w", "t", "t", "t", "d", "d", "w", "d", "d", "w", "w", "d", "d", "t"],
  ["w", "w", "g", "g", "t", "d", "d", "w", "w", "g", "w", "w", "d", "d", "t"],
  ["w", "w", "g", "g", "g", "g", "w", "d", "t", "g", "w", "w", "d", "d", "t"]
]
const tileFactory = (x: number, y: number): Tile | undefined => {
  const char = tilesMap[y][x]
  if (char === ".") return

  const info = tilesLegend[char]

  return {
    id: uniqueId("i."),
    point: { x, y, z: 0 },
    adjacent: {},
    ...info
  }
}

const blockingLegend: Legend<CharacterOptions | TerrainOptions> = {
  "#": {
    type: "terrain",
    texture: "stone",
    color: "#bf7958",
    size: { x: 1, y: 1, z: 2 },
    health: {
      min: 0,
      max: 10,
      current: 10
    },
    dead: false,
    direction: Direction.North
  },
  "=": {
    type: "terrain",
    texture: "stone",
    color: "#bf7958",
    size: { x: 1, y: 1, z: 1 },
    health: {
      min: 0,
      max: 10,
      current: 10
    },
    dead: false,
    direction: Direction.North
  },
  "@": {
    type: "character",
    color: "#f47e1c",
    size: {
      x: 0.35,
      y: 0.35,
      z: 1.8
    },
    health: {
      min: 0,
      max: 50,
      current: 50
    },
    dead: false,
    accuracy: 0.8,
    damage: {
      min: 8,
      max: 10
    },
    direction: Direction.North
  }
}

const blockingMap: TileMap<typeof blockingLegend> = [
  [".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", "@", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
  ["#", ".", ".", ".", "#", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", "=", ".", ".", ".", ".", "."],
  [".", ".", ".", "@", ".", ".", ".", ".", ".", "#", ".", ".", ".", ".", "."],
  [".", ".", "#", ".", ".", ".", ".", ".", ".", "=", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", "=", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "@", ".", ".", ".", "."],
  [".", ".", "#", ".", ".", ".", ".", ".", ".", "=", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", "=", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", "=", ".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", "@", "=", ".", ".", ".", ".", ".", ".", ".", "."]
]

const blockingFactory = (
  x: number,
  y: number
): Character | Terrain | undefined => {
  const char = blockingMap[y][x]

  if (char === ".") return

  const info = blockingLegend[char]

  if (info.type === "character") {
    return {
      id: uniqueId("c."),
      point: { x, y, z: 0 },
      vision: [],
      stance: Stance.Stand,
      ...info
    }
  }

  if (info.type === "terrain") {
    return {
      id: uniqueId("e."),
      point: { x, y, z: 0 },
      adjacent: {},
      ...info
    }
  }
}
