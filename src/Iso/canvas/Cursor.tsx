import React from 'react'
import { Point } from '../types'
import { pointsToPolygon } from '../utils'
import Sprite, { DrawCallback } from './Sprite'

type Props = {
	point: Point
	color?: string
}

const Cursor: React.FC<Props> = ({ point, color = '#f4b41a' }) => {
	const draw = React.useCallback<DrawCallback>(
		(ctx, iso) => {
			const o = iso.getVerts({
				x: 1,
				y: 1,
				z: 1,
			})

			const i = iso.getVerts({
				x: 0.8,
				y: 0.8,
				z: 1,
			})

			const paths = {
				outline: pointsToPolygon(
					o.frontDown,
					o.leftDown,
					o.backDown,
					o.rightDown
				),
				inline: pointsToPolygon(
					i.frontDown,
					i.leftDown,
					i.backDown,
					i.rightDown
				),
			}

			paths.outline.addPath(paths.inline)

			ctx.resetTransform()
			ctx.translate(iso.sprite.origin.x, iso.sprite.origin.y)

			// Outline

			ctx.fillStyle = color
			ctx.strokeStyle = '#000'
			ctx.fill(paths.outline, 'evenodd')
			ctx.stroke(paths.outline)
		},
		[color]
	)

	return <Sprite point={point} draw={draw} />
}

export default Cursor
