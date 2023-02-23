export default {}
// import * as React from "react"

// import { range, uniqueId } from "lodash"
// import { Draft } from "immer"
// import { castBetweenPoints } from "../utils"
// import { useImmerReducer } from "use-immer"
// import { Point, Layer, Item, Step, Stance } from "../types"

// export type Action<T> =
//   | {
//       type: "SET"
//       payload: { point: Point; item?: T }
//     }
//   | {
//       type: "FILL"
//       payload: { point: Point; item?: T }[]
//     }
//   | {
//       type: "MOVE"
//       payload: Step
//     }
//   | {
//       type: "UPDATE"
//       payload: { point: Point; change: Partial<T> | "CLEAR" }[]
//     }
//   | {
//       type: "SWAP"
//       payload: {
//         pointA: Point
//         pointB: Point
//       }
//     }
//   | {
//       type: "CLEAR"
//       payload: { point: Point }
//     }

// const processPositions = <I extends Item>(positions: Layer<I>) => {
//   const has = (x: number, y: number, z: number) => {
//     return (
//       positions[y] &&
//       positions[y][x] &&
//       positions[y][x].content &&
//       (positions[y][x].content as any).size.z === z
//     )
//   }

//   for (let y = 0; y < positions.length; y++) {
//     const row = positions[y]
//     for (let x = 0; x < row.length; x++) {
//       const position = positions[y][x]
//       const item = position.content
//       if (!item) continue

//       if (item.type === "character") {
//         // Raycasting vision

//         const itemHeight =
//           item.stance === Stance.Crouch ? item.size.z / 2 : item.size.z

//         const itemPov = {
//           x: item.point.x + 0.5,
//           y: item.point.y + 0.5,
//           z: itemHeight
//         }

//         const rayCanConnect = (origin: Point, point: Point) => {
//           let v = true

//           castBetweenPoints(
//             origin,
//             point,
//             { blocked: false },
//             ({ x, y, z }, memo) => {
//               const pos = positions[y] && positions[y][x]
//               if (!pos) return
//               const blocker = pos.content

//               if (blocker && blocker.id !== item.id) {
//                 if ((blocker.point.z || 0) + blocker.size.z > z) {
//                   memo.blocked = true
//                 }
//               }
//             },
//             memo => (v = memo.blocked)
//           )

//           return !v
//         }

//         const castToVectors = (origin: Point, vectors: Point[]) => {
//           let visible = 0

//           for (let point of vectors) {
//             if (rayCanConnect(origin, point)) {
//               visible += 1 / vectors.length
//             }
//           }

//           return visible
//         }

//         item.vision = range(positions.length).map(r =>
//           range(positions[0].length).map(c => {
//             let visible = 0

//             const target = positions[r][c].content

//             if (!target) {
//               // TILE
//               visible = castToVectors(itemPov, [
//                 { x: c, y: r, z: 0 },
//                 { x: c + 1, y: r, z: 0 },
//                 { x: c + 1, y: r + 1, z: 0 },
//                 { x: c, y: r + 1, z: 0 }
//               ])
//             } else {
//               if (target.id === item.id) {
//                 return 1
//               }

//               // blocking
//               if (target.type === "character") {
//                 // CHARACTERS
//                 const z = target
//                   ? target.stance === Stance.Crouch
//                     ? 1
//                     : target.size.z + 0.2
//                   : 0

//                 visible = castToVectors(itemPov, [
//                   { x: c, y: r, z: 0 },
//                   { x: c + 1, y: r, z: 0 },
//                   { x: c + 1, y: r + 1, z: 0 },
//                   { x: c, y: r + 1, z: 0 },
//                   { x: c, y: r, z },
//                   { x: c + 1, y: r, z },
//                   { x: c + 1, y: r + 1, z },
//                   { x: c, y: r + 1, z }
//                 ])
//               } else {
//                 // FURNITURE
//                 const z = target.size.z

//                 visible = castToVectors(itemPov, [
//                   { x: c, y: r },
//                   { x: c + 1, y: r },
//                   { x: c + 1, y: r + 1 },
//                   { x: c, y: r + 1 },
//                   { x: c, y: r, z },
//                   { x: c + 1, y: r, z },
//                   { x: c + 1, y: r + 1, z },
//                   { x: c, y: r + 1, z }
//                 ])
//               }
//             }

//             return visible
//           })
//         )
//       } else {
//         const { z } = item.size
//         const adjacent = {
//           north: has(x, y - 1, z),
//           northEast: has(x + 1, y - 1, z),
//           northWest: has(x - 1, y - 1, z),
//           south: has(x, y + 1, z),
//           southEast: has(x + 1, y + 1, z),
//           southWest: has(x - 1, y + 1, z),
//           west: has(x - 1, y, z),
//           east: has(x + 1, y, z)
//         }

//         item.adjacent = adjacent
//       }
//     }
//   }

//   return positions
// }

// function reducer<I extends Item = Item>(draft: Layer<I>, action: Action<I>) {
//   const dx = draft[0].length
//   const dy = draft.length

//   function clampPoint(point: {
//     x: number
//     y: number
//   }): [number, number, boolean] {
//     return [
//       Math.min(Math.max(point.x, 0), dx),
//       Math.min(Math.max(point.y, 0), dy),
//       point.x >= 0 && point.x < dx && point.y >= 0 && point.y < dy
//     ]
//   }

//   switch (action.type) {
//     case "CLEAR": {
//       const [x, y] = clampPoint(action.payload.point)
//       draft[y][x].content = undefined
//       processPositions(draft)
//       return
//     }
//     case "SET": {
//       const [x, y] = clampPoint(action.payload.point)
//       draft[y][x].content = action.payload.item
//       processPositions(draft)
//       return
//     }
//     case "FILL": {
//       for (let { point, item } of action.payload) {
//         const [x, y] = clampPoint(point)
//         draft[y][x].content = item
//         processPositions(draft)
//       }
//       return
//     }
//     case "UPDATE": {
//       for (let item of action.payload) {
//         const [x, y] = clampPoint(item.point)
//         if (draft[y][x].content !== undefined) {
//           if (item.change === "CLEAR") {
//             draft[y][x].content = undefined
//           } else {
//             Object.assign(draft[y][x].content, item.change)
//           }
//         }
//         processPositions(draft)
//       }
//       return
//     }
//     case "MOVE": {
//       const [x1, y1] = clampPoint(action.payload.from)
//       const [x2, y2, safe] = clampPoint(action.payload.to)

//       if (!safe) return

//       const mover = draft[y1][x1].content
//       const blocker = draft[y2][x2].content

//       if (blocker) return

//       if (mover) {
//         mover.point = { x: x2, y: y2 }
//         mover.direction = action.payload.direction

//         draft[y2][x2].content = mover
//         draft[y1][x1].content = undefined

//         processPositions(draft)
//       } else {
//         console.error("Tried to move an item that does not exist.")
//       }
//       return
//     }
//     case "SWAP": {
//       const { pointA, pointB } = action.payload
//       const [x1, y1] = clampPoint(pointA)
//       const [x2, y2] = clampPoint(pointB)

//       if (!draft[y1] || !draft[y2]) return

//       const a = draft[y1][x1]
//       const b = draft[y2][x2]
//       const t = { ...draft[y1][x1] }

//       if (a && b) {
//         a.content = b.content
//         b.content = t.content

//         if (a.content !== undefined) {
//           a.content.point = { x: x1, y: y1 }
//         }

//         if (b.content !== undefined) {
//           b.content.point = { x: x2, y: y2 }
//         }
//       }

//       processPositions(draft)

//       return
//     }
//   }
// }

// /* ---------------------------------- Hook ---------------------------------- */

// export function useIsoLayer<I extends Item>(
//   depthX: number,
//   depthY: number,
//   contentCallback: (x: number, y: number) => I | undefined
// ) {
//   /* -------------------------------- Positions ------------------------------- */

//   const fresh = React.useMemo(
//     () =>
//       processPositions(
//         range(depthY).map(y =>
//           range(depthX).map(x => ({
//             id: uniqueId("p."),
//             point: { x, y, z: 0 },
//             content: contentCallback ? contentCallback(x, y) : undefined,
//             adjacent: {}
//           }))
//         )
//       ),
//     [depthX, depthY, contentCallback]
//   )

//   const [positions, dispatch] = useImmerReducer<Layer<I>, Action<Draft<I>>>(
//     reducer,
//     fresh
//   )

//   /* ----------------------------- Field of Vision ---------------------------- */

//   /* ---------------------------------- Items --------------------------------- */

//   const items = React.useMemo(() => {
//     return positions
//       .flat()
//       .filter(p => p.content !== undefined)
//       .reduce((acc, position) => {
//         position.content && (acc[position.content.id] = position.content)
//         return acc
//       }, {} as Record<string, I>)
//   }, [positions])

//   const getItem = React.useCallback(
//     (x: number, y: number) => {
//       for (let id in items) {
//         const item = items[id]
//         if (item.point.x === x && item.point.y === y) return item
//       }
//       return false
//     },
//     [items]
//   )

//   /* ------------------------------- Raycasting ------------------------------- */

//   const service = React.useMemo(
//     () => ({
//       positions,
//       dispatch,
//       getItem,
//       items
//     }),
//     [positions, dispatch, items, getItem]
//   )

//   return service
// }

// export type IsoLayer = typeof useIsoLayer
