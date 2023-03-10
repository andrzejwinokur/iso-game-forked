import * as React from "react"
import { flatMap } from "lodash"
import { Point } from "../types"

export function useVisibilityPolygon(
  map: boolean[][],
  origin: Point,
  width: number,
  height: number,
  scale = 32
) {
  const [visiblityPolygon, setVisiblityPolygon] = React.useState<Point[]>([])

  const mapToRectangles = React.useCallback(
    (map: boolean[][]) => {
      let rectangles: Rectangle[] = []

      for (let y = 0; y < map.length; y++) {
        const row = map[y]
        for (let x = 0; x < row.length; x++) {
          const cell = row[x]
          if (cell) {
            rectangles.push(new Rectangle(scale * x, scale * y, scale, scale))
          }
        }
      }

      return rectangles
    },
    [scale]
  )

  const visiblity = React.useMemo(() => {
    const rectangles = mapToRectangles(map)
    return new VisibilityPolygon(rectangles, width, height)
  }, [width, height, mapToRectangles])

  React.useEffect(() => {
    visiblity.setMap(mapToRectangles(map))
    visiblity.updateVisible({ x: origin.x * scale, y: origin.y * scale })
    setVisiblityPolygon(visiblity.polygon)
  }, [map, origin])

  return visiblityPolygon
}

export class VisibilityPolygon {
  private _segments: Segment[] = []
  private _viewport: Rectangle
  private _width: number
  private _height: number
  private _map: Rectangle[]
  private _origin: Point = { x: -10, y: -10 }
  private _polygon: Point[] = []

  constructor(map: Rectangle[], width: number, height: number) {
    this._width = width
    this._height = height
    this._map = map
    this._viewport = new Rectangle(0, 0, width, height)
    this._segments = flatMap([this.viewport, ...this.map], rectangle =>
      rectangle.setCornerSegments()
    )
  }

  get polygon() {
    return this._polygon
  }

  set origin(origin: Point) {
    this._origin = origin
    this.updateVisible(origin)
  }

  get origin() {
    return this._origin
  }

  setMap(map: Rectangle[]) {
    this._map = map
    this._segments = flatMap([this.viewport, ...this.map], rectangle =>
      rectangle.setCornerSegments()
    )
  }

  getEndPoints(origin: Point) {
    return flatMap(this.segments, segment => {
      segment.updateFromOrigin(origin)
      return [segment.p1, segment.p2]
    })
  }

  updateVisible(origin: Point) {
    const openSegments: Segment[] = []
    const output: Point[] = []
    let beginAngle = 0

    const endpoints = this.getEndPoints(origin)

    endpoints.sort((pointA: EndPoint, pointB: EndPoint) => {
      if (pointA.angle > pointB.angle) {
        return 1
      }
      if (pointA.angle < pointB.angle) {
        return -1
      }
      if (!pointA.beginsSegment && pointB.beginsSegment) {
        return 1
      }
      if (pointA.beginsSegment && !pointB.beginsSegment) {
        return -1
      }
      return 0
    })

    for (let pass = 0; pass < 2; pass += 1) {
      for (const endpoint of endpoints) {
        const openSegment = openSegments[0]

        if (endpoint.beginsSegment) {
          let index = 0
          let segment = openSegments[index]
          while (segment && endpoint.segment.isInFrontOf(segment, origin)) {
            index += 1
            segment = openSegments[index]
          }

          if (!segment) {
            openSegments.push(endpoint.segment)
          } else {
            openSegments.splice(index, 0, endpoint.segment)
          }
        } else {
          const index = openSegments.indexOf(endpoint.segment)
          if (index > -1) {
            openSegments.splice(index, 1)
          }
        }

        if (openSegment !== openSegments[0]) {
          if (pass === 1) {
            const trianglePoints = VisibilityPolygon.getTrianglePoints(
              origin,
              beginAngle,
              endpoint.angle,
              openSegment
            )

            output.push(...trianglePoints)
          }
          beginAngle = endpoint.angle
        }
      }
    }

    this._polygon = output
    return output
  }

  static lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point) {
    const s =
      ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
      ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y))

    return [
      { x: p1.x + s * (p2.x - p1.x), y: p1.y + s * (p2.y - p1.y) },
      s
    ] as const
  }

  static getTrianglePoints(
    origin: Point,
    angle1: number,
    angle2: number,
    segment: Segment
  ): Point[] {
    const p1 = origin
    const p2 = {
      x: origin.x + Math.cos(angle1),
      y: origin.y + Math.sin(angle1)
    }
    const p3 = { x: 0, y: 0 }
    const p4 = { x: 0, y: 0 }

    if (segment) {
      p3.x = segment.p1.x
      p3.y = segment.p1.y
      p4.x = segment.p2.x
      p4.y = segment.p2.y
    } else {
      // Create two much further points along the angles
      p3.x = origin.x + Math.cos(angle1) * 200
      p3.y = origin.y + Math.sin(angle1) * 200
      p4.x = origin.x + Math.cos(angle2) * 200
      p4.y = origin.y + Math.sin(angle2) * 200
    }

    const [pBegin, sBegin] = VisibilityPolygon.lineIntersection(p3, p4, p1, p2)

    p2.x = origin.x + Math.cos(angle2)
    p2.y = origin.y + Math.sin(angle2)

    const [pEnd, sEnd] = VisibilityPolygon.lineIntersection(p3, p4, p1, p2)

    const v = Math.round(Math.abs(sEnd - sBegin) * 100) / 100

    if (!segment) {
      return []
    }

    if (v === NaN) {
      return []
    }

    segment.visibility = Math.max(v, segment.visibility)
    return [pBegin, pEnd]
  }

  get segments() {
    return this._segments
  }

  get viewport() {
    return this._viewport
  }

  get map() {
    return this._map
  }

  get width() {
    return this._width
  }

  get height() {
    return this._height
  }
}

const interpolate = (pointA: Point, pointB: Point, f: number) => {
  return {
    x: pointA.x * (1 - f) + pointB.x * f,
    y: pointA.y * (1 - f) + pointB.y * f
  }
}

/* ---------------------------------- Point --------------------------------- */

/* -------------------------------- EndPoint -------------------------------- */

export class EndPoint implements Point {
  beginsSegment?: any
  segment?: any
  angle?: any

  constructor(public x: number, public y: number) {
    this.x = x
    this.y = y
  }
}

/* --------------------------------- Segment -------------------------------- */

export class Segment {
  p1: EndPoint
  p2: EndPoint
  d: number = 0
  visibility = 0

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.p1 = new EndPoint(x1, y1)
    this.p2 = new EndPoint(x2, y2)
    this.p1.segment = this
    this.p2.segment = this
  }

  get i1() {
    return interpolate(this.p1, this.p2, 0.01)
  }

  get i2() {
    return interpolate(this.p2, this.p1, 0.01)
  }

  isLeftOf(point: Point) {
    const cross =
      (this.p2.x - this.p1.x) * (point.y - this.p1.y) -
      (this.p2.y - this.p1.y) * (point.x - this.p1.x)
    return cross < 0
  }

  isInFrontOf(segment: Segment, relativePoint: Point) {
    const A1 = this.isLeftOf(segment.i1)
    const A2 = this.isLeftOf(segment.i2)
    const A3 = this.isLeftOf(relativePoint)

    if (A1 === A2 && A2 === A3) {
      return true
    }

    const B1 = segment.isLeftOf(this.i1)
    const B2 = segment.isLeftOf(this.i2)
    const B3 = segment.isLeftOf(relativePoint)

    if (B1 === B2 && B2 !== B3) {
      return true
    }

    return false
  }

  setEndPointAngles(origin: Point) {
    const { x, y } = origin
    const dx = 0.5 * (this.p1.x + this.p2.x) - x
    const dy = 0.5 * (this.p1.y + this.p2.y) - y

    this.d = dx * dx + dy * dy
    this.p1.angle = Math.atan2(this.p1.y - y, this.p1.x - x)
    this.p2.angle = Math.atan2(this.p2.y - y, this.p2.x - x)
  }

  setBeginning() {
    let dAngle = this.p2.angle - this.p1.angle

    if (dAngle <= -Math.PI) {
      dAngle += 2 * Math.PI
    }
    if (dAngle > Math.PI) {
      dAngle -= 2 * Math.PI
    }

    this.p1.beginsSegment = dAngle > 0
    this.p2.beginsSegment = !this.p1.beginsSegment
  }

  updateFromOrigin(origin: Point) {
    this.setEndPointAngles(origin)
    this.setBeginning()
    this.visibility = 0
  }
}

/* -------------------------------- Rectangle ------------------------------- */

export class Rectangle {
  segments: Segment[]

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {
    this.segments = this.setCornerSegments()
  }

  getCorners() {
    return {
      nw: { x: this.x, y: this.y },
      ne: { x: this.x + this.width, y: this.y },
      se: { x: this.x + this.width, y: this.y + this.height },
      sw: { x: this.x, y: this.y + this.height }
    }
  }

  setCornerSegments() {
    const { nw, sw, ne, se } = this.getCorners()
    this.segments = [
      new Segment(nw.x, nw.y, ne.x, ne.y),
      new Segment(nw.x, nw.y, sw.x, sw.y),
      new Segment(ne.x, ne.y, se.x, se.y),
      new Segment(sw.x, sw.y, se.x, se.y)
    ]
    return this.segments
  }

  getVisible() {
    return Math.max(...this.segments.map(s => s.visibility))
  }
}
