import React from 'react'
import { Point, Direction } from '../types'
import Sprite, { DrawCallback } from './Sprite'

type Props = {
	point: Point
	direction: Direction
	color?: string
}

const Step: React.FC<Props> = ({ point, direction, color = '#f57e1c' }) => {
	const draw = React.useCallback<DrawCallback>(
		(ctx, iso, assets) => {
			ctx.resetTransform()
			ctx.clearRect(0, 0, 200, 200)
			ctx.translate(iso.sprite.origin.x, iso.sprite.origin.y)

			if (assets && assets.step) {
				assets['path_' + direction] &&
					ctx.drawImage(
						assets['path_' + direction],
						0,
						0,
						64,
						64,
						-32,
						-32,
						64,
						64
					)

				ctx.save()
				ctx.globalCompositeOperation = 'source-in'
				ctx.fillStyle = color
				ctx.resetTransform()
				ctx.fillRect(0, 0, iso.sprite.width, iso.sprite.height)
				ctx.restore()
			}
		},
		[direction, color]
	)

	return <Sprite point={point} draw={draw} />
}

export default Step
