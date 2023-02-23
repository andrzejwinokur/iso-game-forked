import React from 'react'
import { Point, Point3 } from '../types'
import { hardStroke } from '../utils'
import Sprite, { DrawCallback } from './Sprite'

type Props = {
	point: Point
	size: Point3
	chanceToHit: number
}

const Reticle: React.FC<Props> = ({ point, size, chanceToHit = 1 }) => {
	const draw = React.useCallback<DrawCallback>(
		(ctx, iso) => {
			const { getVerts, sprite, dimensions } = iso
			const { center } = getVerts(size)

			ctx.resetTransform()
			ctx.clearRect(0, 0, sprite.width, sprite.height)
			ctx.translate(sprite.origin.x, sprite.origin.y)

			const path = new Path2D()
			const targetY = -dimensions.backToFront
			const radius = sprite.width * 0.36

			path.ellipse(center.x, targetY, radius, radius, 0, 0, Math.PI * 2, false)

			path.moveTo(radius + 8, targetY)
			path.lineTo(radius - 8, targetY)
			path.moveTo(-radius - 8, targetY)
			path.lineTo(-radius + 8, targetY)
			path.moveTo(center.x, targetY + radius + 8)
			path.lineTo(center.x, targetY + radius - 8)
			path.moveTo(center.x, targetY - radius - 8)
			path.lineTo(center.x, targetY - radius + 8)

			ctx.lineWidth = 4
			hardStroke(ctx, path)
			ctx.lineWidth = 1
			ctx.strokeStyle = '#e6492f'
			hardStroke(ctx, path)

			// ctx.save()
			// ctx.globalCompositeOperation = 'source-in'
			// ctx.fillStyle = color
			// ctx.resetTransform()
			// ctx.fillRect(0, 0, iso.sprite.width, iso.sprite.height)
			// ctx.restore()
		},
		[size]
	)
	return <Sprite point={point} draw={draw} />
}

export default Reticle
