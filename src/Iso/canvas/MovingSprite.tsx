import React from 'react'
import { Point } from '../types'
import { useAssets, useAssetsContext } from '../hooks/useAssets'
import { useIso, useIsoContext } from '../hooks/useIso'
import {
	motion,
	useMotionValue,
	useTransform,
	Transition,
	AnimationControls,
	TargetAndTransition,
} from 'framer-motion'

type IsoHelpers = ReturnType<typeof useIso>

export type DrawCallback = (
	ctx: CanvasRenderingContext2D,
	iso: IsoHelpers,
	assets: ReturnType<typeof useAssets>
) => void

type Props = {
	point: Point
	draw: DrawCallback
	transition?: Transition
	animate?: TargetAndTransition | AnimationControls
	onAnimationComplete?: () => void
	border?: boolean
}

const Block: React.FC<Props> = ({
	point,
	draw,
	border,
	animate,
	transition,
	onAnimationComplete,
}) => {
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

	const mvx = useMotionValue(x)
	const mvy = useMotionValue(y)
	const mvz = useTransform(mvy, (v) => v)

	return (
		<motion.div
			initial={{ x, y }}
			animate={animate || { x, y }}
			transition={transition}
			onAnimationComplete={onAnimationComplete}
			style={{
				pointerEvents: 'none',
				position: 'absolute',
				top: 0,
				left: 0,
				x: mvx,
				y: mvy,
				zIndex: mvz,
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
