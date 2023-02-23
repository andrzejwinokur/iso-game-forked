export default {}
// import { useIsoLayer } from './useIsoLayer'
// import { uniqueId } from 'lodash'
// import { Item } from '../types'

// export type CustomItem<P extends Record<string, any> = {}> = P & Partial<Item>

// export type Legend<P extends Record<string, any>> = Record<
// 	string,
// 	CustomItem<P>
// >

// export type TileMap<L extends Legend<I> = {}, I extends CustomItem = {}> = (
// 	| '.'
// 	| keyof L)[][]

// export function parseMap<L extends Legend<CustomItem>>(
// 	map: TileMap<L>,
// 	legend: L,
// 	z: number
// ) {
// 	return (x: number, y: number) => {
// 		const char = map[y][x]
// 		if (char === '.') return

// 		const info = legend[char]

// 		return {
// 			id: uniqueId('i.'),
// 			point: { x, y, z },
// 			adjacent: {},
// 			...info,
// 		}
// 	}
// }

// export function useMapLayer<L extends Legend<Item>>(
// 	map: TileMap<L>,
// 	legend: L,
// 	depthX: number,
// 	depthY: number
// ) {
// 	return useIsoLayer(depthX, depthY, (x, y) => {
// 		const char = map[y][x]
// 		if (char === '.') return

// 		const info = legend[char]

// 		return {
// 			id: uniqueId('i.'),
// 			point: { x, y, z: 0 },
// 			adjacent: {},
// 			...info,
// 		}
// 	})
// }
