import {
  Point,
  Point3,
  Direction,
  Directions,
  Straights,
  Step,
  Diagonals
} from "./types"

// Hit testing algorithm

const ccw = (A: [number, number], B: [number, number], C: [number, number]) =>
  (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

export const intersect = (
  A: [number, number],
  B: [number, number],
  C: [number, number],
  D: [number, number]
) => ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)

/**
 * Get whether or not a given point lies within a polygon.
 * @param point
 * @param vs
 * @param minX
 */
export function pointInPolygon(
  point: { x: number; y: number },
  vertices: { x: number; y: number }[],
  minX?: number
): boolean

export function pointInPolygon(
  point: [number, number],
  vertices: [number, number][],
  minX?: number
): boolean

export function pointInPolygon(point: any, vertices: any[], minX = -999) {
  let ps = !!(point as { x: number; y: number }).x
    ? [
        (point as { x: number; y: number }).x,
        (point as { x: number; y: number }).y
      ]
    : point
  let ts: [number, number][] = !!(vertices[0] as { x: number; y: number }).x
    ? (vertices as { x: number; y: number }[]).map(p => [p.x, p.y])
    : (vertices as [number, number][])

  let inside = false
  let i = 0
  let j = ts.length - 1

  while (i < ts.length) {
    if (intersect([minX, ps[1]], [ps[0], ps[1]], ts[i], ts[j])) {
      inside = !inside
    }
    j = i++
  }

  return inside
}

export function getPointRotater(
  theta: number,
  originX: number,
  originY: number
) {
  const s = Math.sin(theta)
  const c = Math.cos(theta)

  return (point: Point) => {
    let { x, y, z = 0 } = point
    x -= originX
    y -= originY

    return {
      x: x * c - y * s + originX,
      y: y * c + x * s + originY,
      z
    }
  }
}

export function throttle(
  func: (...args: any[]) => any,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  var context: any, args: any, result: any
  var timeout: any = null
  var previous = 0
  if (!options) options = {}
  var later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  return function() {
    var now = Date.now()
    if (!previous && options.leading === false) previous = now
    var remaining = wait - (now - previous)
    // @ts-ignore
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

export const straightMoves: Straights<Point> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
  east: { x: 1, y: 0 }
}

export const diagonalMoves: Diagonals<Point> = {
  northEast: { x: 1, y: -1 },
  northWest: { x: -1, y: -1 },
  southEast: { x: 1, y: 1 },
  southWest: { x: -1, y: 1 }
}

export const moves: Directions<Point> = {
  none: { x: 0, y: 0 },
  ...straightMoves,
  ...diagonalMoves
}

export function getStep(pointA: Point, pointB: Point): Step {
  const point = subtractPoints(pointB, pointA)
  for (let [direction, offset] of Object.entries(diagonalMoves)) {
    if (pointsAreEqual(point, offset)) {
      return {
        direction: direction as Direction,
        from: pointA,
        to: pointB,
        diagonal: true
      }
    }
  }

  for (let [direction, offset] of Object.entries(straightMoves)) {
    if (pointsAreEqual(point, offset)) {
      return {
        direction: direction as Direction,
        from: pointA,
        to: pointB,
        diagonal: false
      }
    }
  }

  return {
    direction: Direction.None,
    from: pointA,
    to: pointB,
    diagonal: false
  }
}

export function isDiagonal(direction: Direction) {
  return Object.keys(diagonalMoves).includes(direction)
}

export function isStraight(direction: Direction) {
  return Object.keys(straightMoves).includes(direction)
}

export function hardStroke(ctx: CanvasRenderingContext2D, path: Path2D) {
  ctx.stroke(path)
  ctx.stroke(path)
  ctx.stroke(path)
  ctx.stroke(path)
}

export function pointsToString(...points: Point[]) {
  return points.map(p => `${p.x},${p.y}`).join(" ")
}

export function pointsToPath(start: Point, ...points: Point[]) {
  return new Path2D(
    `M${start.x},${start.y}` + points.map(p => `L${p.x},${p.y}`).join(" ")
  )
}

export function pointsToPolygon(...points: Point[]) {
  if (points.length < 2) return new Path2D()
  const [start, ...rest] = points
  return new Path2D(
    `M${start.x},${start.y}` + rest.map(p => `L${p.x},${p.y}`).join(" ") + "Z"
  )
}

export function pointsToHollowPolygon(outer: Point[], inner: Point[]) {
  const [oStart, ...oPoints] = outer
  const [iStart, ...iPoints] = inner
  return new Path2D(
    `M${oStart.x},${oStart.y}` +
      oPoints.map(p => `L${p.x},${p.y}`).join(" ") +
      `M${iStart.x},${iStart.y}` +
      iPoints.map(p => `L${p.x},${p.y}`).join(" ")
  )
}

export function pointsToPathData(start: Point, ...points: Point[]) {
  return points.map(p => `M${start.x},${start.y} L${p.x},${p.y}`).join(" ")
}

export function pointsToData(...points: Point[]) {
  return points.map((p, i) => ({
    x: i % 2 === 0 ? 0 : 1,
    y: i % 7 === 0 ? 0 : 1
  }))
}

export function getDot2(pointA: Point, pointB: Point) {
  return pointA.x * pointB.x + pointA.y * pointB.y
}

export function getDot3(pointA: Point3, pointB: Point3) {
  return pointA.x * pointB.x + pointA.y * pointB.y + pointA.z * pointB.z
}

export function getLength2(point: Point) {
  return Math.hypot(point.x, point.y)
}

export function getLength3(point: Point3) {
  return Math.hypot(point.x, point.y, point.z)
}

export function getAngleBetweenPoints2(pointA: Point, pointB: Point) {
  return Math.acos(
    getDot2(pointA, pointB) / (getLength2(pointA) * getLength2(pointB))
  )
}
export function getAngleBetweenPoints3(pointA: Point3, pointB: Point3) {
  return Math.acos(
    getDot3(pointA, pointB) / (getLength3(pointA) * getLength3(pointB))
  )
}

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

export function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

export function castBetweenPoints<T extends any>(
  from_position: Point,
  to_position: Point,
  memo: T,
  onPoint: (point: Point3, memo: T) => void,
  onComplete: (memo: T) => void
) {
  var temp

  // safty first kids
  var x0 = Math.floor(from_position.x)
  var y0 = Math.floor(from_position.y)
  var z0 = Math.floor(from_position.z || 0)
  var x1 = Math.floor(to_position.x)
  var y1 = Math.floor(to_position.y)
  var z1 = Math.floor(to_position.z || 0)

  //'steep' xy Line, make longest delta x plane
  var swap_xy = Math.abs(y1 - y0) > Math.abs(x1 - x0)
  if (swap_xy) {
    temp = x0
    x0 = y0
    y0 = temp //swap(x0, y0);
    temp = x1
    x1 = y1
    y1 = temp //swap(x1, y1);
  }
  //do same for xz
  var swap_xz = Math.abs(z1 - z0) > Math.abs(x1 - x0)
  if (swap_xz) {
    temp = x0
    x0 = z0
    z0 = temp //swap(x0, z0);
    temp = x1
    x1 = z1
    z1 = temp //swap(x1, z1);
  }

  //delta is Length in each plane
  var delta_x = Math.abs(x1 - x0)
  var delta_y = Math.abs(y1 - y0)
  var delta_z = Math.abs(z1 - z0)

  //drift controls when to step in 'shallow' planes
  //starting value keeps Line centred
  var drift_xy = delta_x / 2
  var drift_xz = delta_x / 2

  //direction of line
  var step_x = 1
  if (x0 > x1) step_x = -1
  var step_y = 1
  if (y0 > y1) step_y = -1
  var step_z = 1
  if (z0 > z1) step_z = -1

  //starting point
  var y = y0
  var z = z0

  var cx, cy, cz

  //step through longest delta (which we have swapped to x)
  for (var x = x0; x !== x1; x += step_x) {
    //copy position
    cx = x
    cy = y
    cz = z

    //unswap (in reverse)
    if (swap_xz) {
      temp = cx
      cx = cz
      cz = temp //swap(cx, cz);
    }
    if (swap_xy) {
      temp = cx
      cx = cy
      cy = temp //swap(cx, cy);
    }
    //passes through this point
    if (onPoint) onPoint({ x: cx, y: cy, z: cz }, memo)

    //update progress in other planes
    drift_xy = drift_xy - delta_y
    drift_xz = drift_xz - delta_z

    //step in y plane
    if (drift_xy < 0) {
      y = y + step_y
      drift_xy = drift_xy + delta_x
    }

    //same in z
    if (drift_xz < 0) {
      z = z + step_z
      drift_xz = drift_xz + delta_x
    }
  }
  if (onComplete) {
    onComplete(memo)
  }
  return memo
}

export function createPoint(x: number, y: number, z = 0) {
  return { x: x, y: y, z: z }
}

export function pointsAreEqual(pointA: Point, pointB: Point) {
  return pointA.x === pointB.x && pointA.y === pointB.y
}

export function addPoints(point1: Point, point2: Point) {
  return {
    x: point1.x + point2.x,
    y: point1.y + point2.y,
    z: point1.z || 0 + (point2.z || 0)
  }
}

export function subtractPoints(point1: Point, point2: Point) {
  return {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: point1.z || 0 - (point2.z || 0)
  }
}

export function multiplyPoints(point1: Point, point2: Point) {
  return {
    x: point1.x * point2.x,
    y: point1.y * point2.y,
    z: (point1.z || 0) * (point2.z || 0)
  }
}

export function dotPoints(point1: Point, point2: Point) {
  return (
    point1.x * point2.x +
    point1.y * point2.y +
    (point1.z || 0) * (point2.z || 0)
  )
}

export function rotateYPoint(point: Point, ang: number) {
  var cos = Math.cos(ang)
  var sin = Math.sin(ang)
  return createPoint(
    sin * (point.z || 0) + cos * point.x,
    point.y,
    cos * (point.z || 0) - sin * point.x
  )
}

export function rotateXPoint(point: Point, ang: number) {
  var cos = Math.cos(ang)
  var sin = Math.sin(ang)
  return createPoint(
    point.x,
    cos * point.y - sin * (point.z || 0),
    sin * point.y + cos * (point.z || 0)
  )
}

export function rotateZPoint(point: Point, ang: number) {
  var cos = Math.cos(ang)
  var sin = Math.sin(ang)
  return createPoint(
    cos * point.x - sin * point.y,
    sin * point.x + cos * point.y,
    point.z || 0
  )
}

export function dupPoint(point: Point) {
  return createPoint(point.x, point.y, point.z || 0)
}

export function hitTest3d(hit: Point3, point: Point3, size: Point3) {
  return !(
    hit.x < point.x ||
    hit.x > point.x + size.x ||
    hit.y < point.y ||
    hit.y > point.y + size.y ||
    hit.z < point.z || // below are still hits
    hit.z > point.z + size.z - 0.1
  )
}

// https://github.com/andyhall/fast-voxel-raycast
export function traceRay(
  getVoxel: (point: Point3, distance: number) => any,
  origin: Point3,
  direction: Point3,
  max_d = 64.0,
  hit_pos = { x: 0, y: 0, z: 0 },
  hit_norm = { x: 0, y: 0, z: 0 },
  EPSILON = 1e-8
) {
  let { x: px, y: py, z: pz } = origin
  let { x: dx, y: dy, z: dz } = direction
  let ds = Math.hypot(dx, dy, dz) // step length

  if (ds < EPSILON) {
    if (hit_pos) {
      hit_pos = { x: hit_pos.z, y: hit_pos.z, z: hit_pos.z }
    }
    if (hit_norm) {
      hit_norm = { x: hit_norm.z, y: hit_norm.z, z: hit_norm.z }
    }
    return { complete: true, hit: undefined, pos: hit_pos, norm: hit_norm }
  }

  dx /= ds // delta
  dy /= ds
  dz /= ds

  var t = 0.0,
    floor = Math.floor,
    ix = floor(px) | 0, // position
    iy = floor(py) | 0,
    iz = floor(pz) | 0,
    stepx = dx > 0 ? 1 : -1, // step
    stepy = dy > 0 ? 1 : -1,
    stepz = dz > 0 ? 1 : -1,
    // dx,dy,dz are already normalized
    txDelta = Math.abs(1 / dx), // step delta
    tyDelta = Math.abs(1 / dy),
    tzDelta = Math.abs(1 / dz),
    xdist = stepx > 0 ? ix + 1 - px : px - ix, // position delta
    ydist = stepy > 0 ? iy + 1 - py : py - iy,
    zdist = stepz > 0 ? iz + 1 - pz : pz - iz,
    // location of nearest voxel boundary, in units of t
    txMax = txDelta < Infinity ? txDelta * xdist : Infinity, // stepped
    tyMax = tyDelta < Infinity ? tyDelta * ydist : Infinity,
    tzMax = tzDelta < Infinity ? tzDelta * zdist : Infinity,
    steppedIndex = -1

  let dist = 0
  // main loop along raycast vector
  while (t <= max_d) {
    dist++
    // exit check
    var b = getVoxel({ x: px + t * dx, y: py + t * dy, z: pz + t * dz }, dist)

    if (b !== undefined) {
      if (hit_pos) {
        hit_pos.x = px + t * dx
        hit_pos.y = py + t * dy
        hit_pos.z = pz + t * dz
      }
      if (hit_norm) {
        hit_norm.x = hit_norm.y = hit_norm.z = 0
        if (steppedIndex === 0) hit_norm.x = -stepx
        if (steppedIndex === 1) hit_norm.y = -stepy
        if (steppedIndex === 2) hit_norm.z = -stepz
      }
      return { complete: false, hit: b, point: hit_pos, normal: hit_norm }
    }

    // advance t to next nearest voxel boundary
    if (txMax < tyMax) {
      if (txMax < tzMax) {
        ix += stepx
        t = txMax
        txMax += txDelta
        steppedIndex = 0
      } else {
        iz += stepz
        t = tzMax
        tzMax += tzDelta
        steppedIndex = 2
      }
    } else {
      if (tyMax < tzMax) {
        iy += stepy
        t = tyMax
        tyMax += tyDelta
        steppedIndex = 1
      } else {
        iz += stepz
        t = tzMax
        tzMax += tzDelta
        steppedIndex = 2
      }
    }
  }

  // no voxel hit found
  if (hit_pos) {
    hit_pos.x = px + t * dx
    hit_pos.y = py + t * dy
    hit_pos.z = pz + t * dz
  }
  if (hit_norm) {
    hit_norm.x = hit_norm.y = hit_norm.z = 0
  }

  return { complete: true, hit: undefined, point: hit_pos, normal: hit_norm }
}
