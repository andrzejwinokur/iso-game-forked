import { AnimationControls } from "framer-motion"
import { useIso } from "./hooks/useIso"
import { useAssets } from "./hooks/useAssets"
export type ValueOf<T> = T[keyof T]
export type Position<T extends any = Item> = {
  id: string
  point: Point
  content?: T
}

export type Layer<T extends any = Item> = Position<T>[][]

export interface Item {
  id: string
  point: Point3
  size: Point3
}

export interface TileOptions {
  type: string
  texture: string
  color: string
  walkable: boolean
  size: Point3
}

export interface Tile extends Item, TileOptions, Edged {}

export interface Living {
  health: {
    min: number
    max: number
    current: number
  }
  dead: boolean
}

export interface Edged {
  adjacent: Partial<Directions<boolean>>
}

export interface Textured {
  texture: string
}

export interface Colored {
  color: string
}

export interface Directed {
  direction: Direction
}

export interface TerrainOptions extends Textured, Directed, Living, Colored {
  type: "terrain"
  size: Point3
}

export interface Terrain extends Item, TerrainOptions, Edged {}

export interface CharacterOptions extends Directed, Living, Colored {
  type: "character"
  accuracy: number
  damage: {
    min: number
    max: number
  }
  size: Point3
}

export interface Character extends Item, CharacterOptions {
  stance: Stance
  vision: number[][]
}

export type Blocker = Character | Terrain

export interface Point {
  x: number
  y: number
  z?: number
}

export interface Point3 extends Point {
  z: number
}

export enum Vert {
  Center = "center",
  CenterDown = "centerDown",
  BackDown = "backDown",
  RightDown = "rightDown",
  FrontDown = "frontDown",
  LeftDown = "leftDown",
  CenterUp = "centerUp",
  BackUp = "backUp",
  RightUp = "rightUp",
  FrontUp = "frontUp",
  LeftUp = "leftUp"
}

export type Verts<T = Point> = Record<Vert, T>

export enum Dimension {
  LeftToRight = "leftToRight",
  BackToFront = "backToFront",
  DownToUp = "downToUp"
}
export type Dimensions = Record<Dimension, number>

export type SpriteFrame = {
  x: number
  y: number
  width: number
  height: number
  maxX: number
  maxY: number
  origin: {
    x: number
    y: number
  }
}

export type Assets = { [key: string]: HTMLImageElement }

export enum Direction {
  None = "none",
  North = "north",
  NorthEast = "northEast",
  East = "east",
  SouthEast = "southEast",
  South = "south",
  NorthWest = "northWest",
  West = "west",
  SouthWest = "southWest"
}

export enum Straight {
  North = "north",
  East = "east",
  South = "south",
  West = "west"
}

export enum Diagonal {
  NorthEast = "northEast",
  SouthEast = "southEast",
  NorthWest = "northWest",
  SouthWest = "southWest"
}

export enum Turn {
  None = "none",
  Left = "left",
  Right = "right",
  Around = "around",
  HardLeft = "hardLeft",
  HardRight = "hardRight"
}

export type Turns<T> = Record<Turn, T>
export type Diagonals<T> = Record<Diagonal, T>
export type Straights<T> = Record<Straight, T>
export type Directions<T> = Record<Diagonal | Straight | "none", T>

export type Step = {
  direction: Direction
  from: Point
  to: Point
  diagonal: boolean
}
export type Path = Step[]

export enum Stance {
  Stand = "stand",
  Crouch = "crouch",
  Crawl = "crawl"
}

export type Stances<T> = Record<Stance, T>

// export interface Item {
//   id: string
//   type: string
//   size: Point3
//   point: Point
//   direction: Direction
//   adjacent: Partial<Directions<boolean>>
//   selectable: boolean
//   stance?: Stance
//   vision?: number[][]
//   health?: {
//     min: number
//     max: number
//     current: number
//   }
//   damage?: {
//     min: number
//     max: number
//   }
//   accuracy?: number
//   dead?: boolean
// }

export type Action<T extends object = {}> = {
  type: string
  payload?: T
}

export type Bullet = {
  id: string
  animation: AnimationControls
}

type IsoHelpers = ReturnType<typeof useIso>

export type DrawCallback = (
  ctx: CanvasRenderingContext2D,
  iso: IsoHelpers,
  assets: ReturnType<typeof useAssets>
) => void
