import React from 'react'
import { Point } from '../types'
import { useAssets, useAssetsContext } from '../hooks/useAssets'
import { useIso, useIsoContext } from '../hooks/useIso'
import { motion } from 'framer-motion'

type Props = {
	point: Point
	border?: boolean
}

const Block: React.FC<Props> = ({ point, border, children }) => {
	const iso = useIsoContext()
	const { height, width, x, y } = iso.getSpriteFrame(point)

	return (
		<motion.svg
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
				border: border ? '1px solid red' : '',
			}}
		>
			<motion.g style={{ ...iso.sprite.origin }}>{children}</motion.g>
		</motion.svg>
	)
}

export default Block
