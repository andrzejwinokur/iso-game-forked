import React from 'react'
import { Point } from '../types'
import { useAssets, useAssetsContext } from '../hooks/useAssets'
import { useIso, useIsoContext } from '../hooks/useIso'
import { motion } from 'framer-motion'

type IsoHelpers = ReturnType<typeof useIso>

export type DrawCallback = (
	ctx: CanvasRenderingContext2D,
	iso: IsoHelpers,
	assets: ReturnType<typeof useAssets>
) => void

type Props = {
	point: Point
	draw: DrawCallback
	border?: boolean
}

const Block: React.FC<Props> = ({ point, draw, border }) => {
	const iso = useIsoContext()
	const assets = useAssetsContext()
	const { height, width, x, y } = iso.getSpriteFrame(point)
	const rCanvas = React.useRef<HTMLCanvasElement>(null)

	React.useEffect(() => {
		if (rCanvas.current) {
			const ctx = rCanvas.current.getContext('2d')
			if (!ctx) return
			draw(ctx, iso, assets)
		}
	}, [draw, iso, assets])

	return (
		<motion.div
			initial={{ x, y }}
			animate={{ x, y }}
			transition={{ duration: 0 }}
			style={{
				pointerEvents: 'none',
				position: 'absolute',
				top: 0,
				left: 0,
				x,
				y,
				zIndex: y,
				width,
				height,
				border: border ? '1px solid #ccc' : '',
			}}
		>
			<canvas ref={rCanvas} width={width} height={height} />
		</motion.div>
	)
}

export default Block
