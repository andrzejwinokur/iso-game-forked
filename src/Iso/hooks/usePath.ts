import * as React from 'react'
import EasyStar from 'easystarjs'
import { Point, Direction, Path } from '../types'
import { getStep } from '../utils'

type Options = {
	diagonal?: boolean
	cornerCutting?: boolean
	costs?: { [key: number]: number }
	iterations?: number
	initial?: Path
}

export function usePath(
	grid: number[][],
	walkable: number | number[] = 0,
	options = { diagonal: true, cornerCutting: true } as Options
) {
	const easystar = React.useMemo(() => {
		const easy = new EasyStar.js()
		easy.setGrid(grid)
		easy.setAcceptableTiles(walkable)
		if (options.diagonal) easy.enableDiagonals()
		options.cornerCutting
			? easy.enableCornerCutting()
			: easy.disableCornerCutting()
		if (options.iterations) easy.setIterationsPerCalculation(options.iterations)

		return easy
	}, [
		grid,
		walkable,
		options.cornerCutting,
		options.diagonal,
		options.iterations,
	])

	type PathDirection = Direction

	const [path, setPath] = React.useState<Path>([])

	const search = React.useCallback(
		(start: Point, end: Point) => {
			easystar.findPath(start.x, start.y, end.x, end.y, (steps = []) => {
				if (steps === null) return

				const next = steps.map((point: Point, i) => {
					if (i === 0) return getStep(point, point)

					return getStep(steps[i - 1], point)
				})

				setPath(next)
			})
			easystar.calculate()
		},
		[easystar]
	)

	return { path, setPath, search }
}
