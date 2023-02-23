import * as React from "react"
import { range, uniqueId, flatten } from "lodash"
import { Layer, Tile, Item } from "../types"

const processTilePositions = (positions: Layer<Tile>) => {
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

  return positions
}

/* ---------------------------------- Hook ---------------------------------- */

export function useTileLayer<I extends Item>(
  depthX: number,
  depthY: number,
  contentCallback: (x: number, y: number) => Tile | undefined
) {
  /* -------------------------------- Positions ------------------------------- */

  const positions = React.useMemo(
    () =>
      processTilePositions(
        range(depthY).map(y =>
          range(depthX).map(x => ({
            id: uniqueId("t."),
            point: { x, y, z: 0 },
            content: contentCallback ? contentCallback(x, y) : undefined,
            adjacent: {}
          }))
        )
      ),
    [depthX, depthY, contentCallback]
  )

  /* ----------------------------- Field of Vision ---------------------------- */

  /* ---------------------------------- Items --------------------------------- */

  const array = React.useMemo(() => {
    return flatten(positions).reduce((acc, position) => {
      if (position.content) {
        acc.push(position.content)
      }
      return acc
    }, [] as Tile[])
  }, [positions])

  const items = React.useMemo(() => {
    return flatten(positions).reduce((acc, position) => {
      if (position.content) {
        acc[position.content.id] = position.content
      }
      return acc
    }, {} as Record<string, Tile>)
  }, [positions])

  const getItem = React.useCallback(
    (x: string | number, y = 0) => {
      if (typeof x === "string") {
        return items[x]
      }
      return positions[y] && positions[y][x] && positions[y][x].content
    },
    [items, positions]
  )

  /* ------------------------------- Raycasting ------------------------------- */

  return {
    array,
    positions,
    getItem,
    items
  }
}

export type UseTileLayer = typeof useTileLayer
export type TileLayer = ReturnType<typeof useTileLayer>
