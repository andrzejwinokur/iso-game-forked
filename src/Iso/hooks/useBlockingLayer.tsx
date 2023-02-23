import * as React from "react"
import { Draft } from "immer"
import { useImmerReducer } from "use-immer"
import { range, uniqueId, flatten } from "lodash"
import {
  Layer,
  Point,
  Point3,
  Step,
  Stance,
  ValueOf,
  Character,
  Terrain,
  Blocker
} from "../types"
import { pointsAreEqual, hitTest3d, traceRay, subtractPoints } from "../utils"
import { castRay } from "./useRaycaster"

export type Action<T> =
  | {
      type: "SET"
      payload: { point: Point; item?: T }
    }
  | {
      type: "FILL"
      payload: { point: Point; item?: T }[]
    }
  | {
      type: "MOVE"
      payload: Step
    }
  | {
      type: "UPDATE"
      payload: { point: Point; change: Partial<T> | "CLEAR" }[]
    }
  | {
      type: "SWAP"
      payload: {
        pointA: Point
        pointB: Point
      }
    }
  | {
      type: "CLEAR"
      payload: { point: Point }
    }

const getCornerVerts = (point: Point3) => {
  const { x, y, z } = point

  const minX = x
  const maxX = minX + 1
  const minY = y
  const maxY = minY + 1

  return [
    { x: minX, y: minY, z: z },
    { x: maxX, y: minY, z: z },
    { x: maxX, y: maxY, z: z },
    { x: minX, y: maxY, z: z }
  ]
}

const getSpaceVerts = (point: Point3, size: Point3) => {
  const { x, y, z } = point
  const { x: sx, y: sy, z: sz } = point
  const minX = x + 0.5 - 0.5 * sx
  const maxX = minX + sy
  const minY = y + 0.5 - 0.5 * sy
  const maxY = minY + sy
  const minZ = z
  const maxZ = minZ + sz

  return [
    { x: minX, y: minY, z: minZ },
    { x: maxX, y: minY, z: minZ },
    { x: maxX, y: maxY, z: minZ },
    { x: minX, y: maxY, z: minZ },
    { x: minX, y: minY, z: maxZ },
    { x: maxX, y: minY, z: maxZ },
    { x: maxX, y: maxY, z: maxZ },
    { x: minX, y: maxY, z: maxZ }
  ]
}

const castRayBetweenPoints = (
  from: Point3,
  to: Point3,
  blocking: BlockingPositions
) => {
  const fx = Math.floor(from.x)
  const fy = Math.floor(from.y)
  const result = traceRay(
    pt => {
      const x = Math.floor(pt.x),
        y = Math.floor(pt.y),
        hit = blocking[y] && blocking[y][x] && blocking[y][x].content

      if (x === fx && y === fy) return

      if (hit !== undefined && hitTest3d(pt, hit.point, hit.size)) {
        return hit
      }
    },
    from,
    subtractPoints(to, from)
  )

  return result
}

const castRayBetweenCharacters = (
  itemA: Character,
  itemB: Character,
  blocking: BlockingPositions
) => {
  const { x: fpx, y: fpy, z: fpz } = itemA.point
  const { z: fsz } = itemA.size
  const { x: tpx, y: tpy, z: tpz } = itemB.point
  const { z: tsz } = itemB.size

  const from = {
    x: fpx + 0.5,
    y: fpy + 0.5,
    z:
      (fpz || 0) +
      (itemA.stance ? (itemA.stance === Stance.Stand ? fsz : fsz / 2) : fsz)
  }

  const to = {
    x: tpx + 0.5,
    y: tpy + 0.5,
    z:
      (tpz || 0) +
      (itemB.stance ? (itemB.stance === Stance.Stand ? tsz : tsz / 2) : tsz)
  }

  return castRayBetweenPoints(from, to, blocking)
}

const getVisibility = (
  from: Point3,
  point: Point3,
  size: Point3,
  blocking: BlockingPositions
) => {
  let visibility = 0
  if (size.z === 0) {
    // Tile

    const corners = getCornerVerts(point)
    for (let corner of corners) {
      const hit = castRayBetweenPoints(from, corner, blocking)

      if (hit.complete) {
        visibility += 1 / 4
      }
    }
  } else {
    // Anything else
    const verts = getSpaceVerts(point, size)
    for (let vert of verts) {
      if (castRayBetweenPoints(from, vert, blocking).complete) {
        visibility += 1 / 4
      }
    }
  }

  return visibility
}

const processPositions = (positions: Layer<Character | Terrain>) => {
  const connect = (x: number, y: number, z: number) => {
    return (
      positions[y] &&
      positions[y][x] &&
      positions[y][x].content &&
      (positions[y][x].content as any).size.z === z
    )
  }

  for (let y = 0; y < positions.length; y++) {
    const row = positions[y]
    for (let x = 0; x < row.length; x++) {
      const position = positions[y][x]
      const item = position.content

      if (!item) continue

      if (item.type === "character") {
        // Vision
        const itemHeight =
          item.stance === Stance.Crouch ? item.size.z / 2 : item.size.z

        const itemPov = {
          x: item.point.x + 0.5,
          y: item.point.y + 0.5,
          z: itemHeight
        }
        item.vision = []

        item.vision = positions.map((row, r) =>
          row.map((col, c) => {
            const target = col.content
            if (target) {
              // Blocking
              return getVisibility(
                itemPov,
                target.point,
                target.size,
                positions
              )
            } else {
              // Tile

              const tile = {
                x: c,
                y: r,
                z: 0
              }

              return getVisibility(
                // Tile
                itemPov,
                tile,
                {
                  x: 1,
                  y: 1,
                  z: 0
                },
                positions
              )
            }
          })
        )
      } else {
        // Adjacent
        const { z } = item.size

        const adjacent = {
          north: connect(x, y - 1, z),
          northEast: connect(x + 1, y - 1, z),
          northWest: connect(x - 1, y - 1, z),
          south: connect(x, y + 1, z),
          southEast: connect(x + 1, y + 1, z),
          southWest: connect(x - 1, y + 1, z),
          west: connect(x - 1, y, z),
          east: connect(x + 1, y, z)
        }

        item.adjacent = adjacent
      }
    }
  }

  return positions
}

function reducer(draft: Layer<Blocker>, action: Action<Blocker>) {
  const dx = draft[0].length
  const dy = draft.length

  function clampPoint(point: {
    x: number
    y: number
  }): [number, number, boolean] {
    return [
      Math.min(Math.max(point.x, 0), dx),
      Math.min(Math.max(point.y, 0), dy),
      point.x >= 0 && point.x < dx && point.y >= 0 && point.y < dy
    ]
  }

  switch (action.type) {
    case "CLEAR": {
      const [x, y] = clampPoint(action.payload.point)
      draft[y][x].content = undefined
      processPositions(draft)
      return
    }
    case "SET": {
      const [x, y] = clampPoint(action.payload.point)
      draft[y][x].content = action.payload.item
      processPositions(draft)
      return
    }
    case "FILL": {
      for (let { point, item } of action.payload) {
        const [x, y] = clampPoint(point)
        draft[y][x].content = item
        processPositions(draft)
      }
      return
    }
    case "UPDATE": {
      for (let item of action.payload) {
        const [x, y] = clampPoint(item.point)
        if (draft[y][x].content !== undefined) {
          if (item.change === "CLEAR") {
            draft[y][x].content = undefined
          } else {
            Object.assign(draft[y][x].content, item.change)
          }
        }
        processPositions(draft)
      }
      return
    }
    case "MOVE": {
      const [x1, y1] = clampPoint(action.payload.from)
      const [x2, y2, safe] = clampPoint(action.payload.to)

      if (!safe) return

      const mover = draft[y1][x1].content
      const blocker = draft[y2][x2].content

      if (blocker) return

      if (mover !== undefined) {
        mover.point = { x: x2, y: y2, z: 0 }
        mover.direction = action.payload.direction

        draft[y2][x2].content = mover
        draft[y1][x1].content = undefined

        processPositions(draft)
      } else {
        console.error("Tried to move an item that does not exist.")
      }
      return
    }
    case "SWAP": {
      const { pointA, pointB } = action.payload
      const [x1, y1] = clampPoint(pointA)
      const [x2, y2] = clampPoint(pointB)

      if (!draft[y1] || !draft[y2]) return

      const a = draft[y1][x1]
      const b = draft[y2][x2]
      const t = { ...draft[y1][x1] }

      if (a && b) {
        a.content = b.content
        b.content = t.content

        if (a.content !== undefined) {
          a.content.point = { x: x1, y: y1, z: 0 }
        }

        if (b.content !== undefined) {
          b.content.point = { x: x2, y: y2, z: 0 }
        }
      }

      processPositions(draft)

      return
    }
  }
}

/* ---------------------------------- Hook ---------------------------------- */

export function useBlockingLayer(
  depthX: number,
  depthY: number,
  contentCallback: (x: number, y: number) => Blocker | undefined
) {
  /* -------------------------------- Positions ------------------------------- */

  const fresh = React.useMemo(
    () =>
      processPositions(
        range(depthY).map(y =>
          range(depthX).map(x => ({
            id: uniqueId("p."),
            point: { x, y, z: 0 },
            content: contentCallback ? contentCallback(x, y) : undefined,
            adjacent: {}
          }))
        )
      ),
    [depthX, depthY, contentCallback]
  )

  const [positions, dispatch] = useImmerReducer<
    Layer<Blocker>,
    Action<Draft<Blocker>>
  >(reducer, fresh)

  /* ----------------------------- Field of Vision ---------------------------- */

  /* ---------------------------------- Items --------------------------------- */

  const array = React.useMemo(() => {
    return flatten(positions).reduce((acc, position) => {
      if (position.content) {
        acc.push(position.content)
      }
      return acc
    }, [] as Blocker[])
  }, [positions])

  const items = React.useMemo(() => {
    return array.reduce((acc, blocker) => {
      acc[blocker.id] = blocker
      return acc
    }, {} as Record<string, Blocker>)
  }, [array])

  const getItem = React.useCallback(
    (x: string | number, y = 0) => {
      if (typeof x === "string") {
        return items[x]
      }

      return positions[y] && positions[y][x] && positions[y][x].content
    },
    [items]
  )

  /* ------------------------------- Raycasting ------------------------------- */

  /* --------------------------------- Service -------------------------------- */

  const service = React.useMemo(
    () => ({
      positions,
      dispatch,
      getItem,
      array,
      items
    }),
    [positions, dispatch, items, array, getItem]
  )

  return service
}

export type UseBlockingLayer = typeof useBlockingLayer
export type BlockingLayer = ReturnType<typeof useBlockingLayer>
export type BlockingPositions = BlockingLayer["positions"]
export type BlockingItem = ValueOf<BlockingLayer["items"]>
