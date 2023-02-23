import { useMotionValue, MotionValue } from 'framer-motion'
import * as React from 'react'

export function useRelative<T = any>(
	parents: (MotionValue<T> | T)[],
	transform: (...parents: T[]) => T,
	dependencies: any[] = []
) {
	const t = React.useRef(transform)

	const transformedValue = useMotionValue(t.current(...parents.map(toValue)))

	React.useLayoutEffect(() => {
		const computeValue = () =>
			transformedValue.set(t.current(...parents.map(toValue)))

		computeValue()

		const removers = parents
			.map((v) => isMotionValue(v) && v.onChange(computeValue))
			.filter((v) => v) as (() => void)[]

		return () => removers.forEach((fn) => fn())
	}, [parents, dependencies, transformedValue])

	return transformedValue
}

// HELPERS

export const isMotionValue = (value: any): value is MotionValue => {
	return value instanceof MotionValue
}

const toValue: <T>(v: MotionValue<T> | T) => T = (v) =>
	isMotionValue(v) ? v.get() : v
