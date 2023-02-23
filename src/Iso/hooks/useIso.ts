import * as React from 'react'
import { Point, Point3, Verts } from '../types'
import { transform } from 'framer-motion'

export const IsoContext = React.createContext<ReturnType<typeof useIso>>(
	{} as ReturnType<typeof useIso>
)

export const useIso = (scale: number, angle = 45, zHeight = 1, padding = 8) => {
	const service = React.useMemo(() => {
		const ratioX = 2
		const ratioY = angle / 45

		const w = Math.floor(scale * ratioX),
			h = Math.floor(scale * ratioY),
			z = Math.floor(
				transform(angle, [45, 90], [Math.ceil(Math.hypot(w / 2, h / 2)), 0])
			)

		const tileSize = {
			w,
			h,
			z,
			hw: w / 2,
			hh: h / 2,
			hz: z / 2,
		}

		const t = tileSize

		const sprite = {
			height: padding * 2 + t.h + zHeight * t.z,
			width: padding * 2 + t.w,
			origin: {
				x: padding + t.hw,
				y: padding * 2 + t.h + zHeight * t.z - t.h - padding,
			},
		}

		const screenToSpace = (point: Point): Point3 => {
			let x = point.x
			let y = point.y
			let z = point.z || 0

			x /= t.hw
			x /= 2
			y -= padding
			y /= t.hh
			y /= 2

			return {
				x: Math.floor(y + x),
				y: Math.floor(y - x),
				z,
			}
		}

		const spaceToScreen = (point: Point): Point => {
			let { x, y, z = 0 } = point

			return {
				x: (x - y) * t.hw,
				y: (x + y) * t.hh - z * t.z,
			}
		}

		const getSpriteFrame = (point: Point) => {
			let { x, y } = spaceToScreen(point)

			x -= t.hw + padding
			y -= t.z * zHeight

			return {
				x,
				y,
				maxX: x + sprite.width,
				maxY: x + sprite.height,
				...sprite,
				origin: {
					x: padding + t.hw,
					y: sprite.height - t.h - padding,
				},
			}
		}

		const getVerts = (size: Point3): Verts<Point> => {
			let { x, y, z } = size
			const ox = (1 - x) / 2
			const oy = (1 - y) / 2

			x += ox
			y += oy

			const verts = {
				center: { x: x / 2, y: y / 2, z: z / 2 },
				centerDown: { x: ox + size.x / 2, y: oy + size.y / 2, z: 0 },
				backDown: { x: ox, y: oy, z: 0 },
				rightDown: { x: x, y: oy, z: 0 },
				frontDown: { x: x, y: y, z: 0 },
				leftDown: { x: ox, y: y, z: 0 },
				centerUp: { x: ox + size.x / 2, y: oy + size.y / 2, z: z },
				backUp: { x: ox, y: oy, z: z },
				rightUp: { x: x, y: oy, z: z },
				frontUp: { x: x, y: y, z: z },
				leftUp: { x: ox, y: y, z: z },
			}

			// const frame = getBlockFrame(size)
			return Object.keys(verts).reduce(
				(acc, key) =>
					Object.assign(acc, {
						[key]: spaceToScreen(verts[key as keyof Verts]),
					}),
				{} as Verts<Point>
			)
		}

		return {
			dimensions: {
				leftToRight: t.w,
				backToFront: t.h,
				downToUp: t.z,
			},
			sprite,
			spaceToScreen,
			getSpriteFrame,
			screenToSpace,
			getVerts,
		}
	}, [scale, angle, padding, zHeight])

	const [state, setState] = React.useState(service)

	React.useEffect(() => {
		setState(service)
	}, [service])

	return state
}

export const useIsoContext = () => React.useContext(IsoContext)
