import * as React from "react"
import { Assets } from "../types"

export const useAssets = <T = Record<string, string>>(textures: T) => {
  const [assets, setAssets] = React.useState<Assets>()

  React.useEffect(() => {
    async function loadAssets() {
      const promises = Object.entries(textures).reduce(
        (acc, [key, url]) => [
          ...acc,
          new Promise<Assets>(resolve => {
            const image = new Image()
            image.onload = () => resolve({ [key]: image })
            image.src = "/textures/" + url
          })
        ],
        [] as Promise<Assets>[]
      )

      const images = await Promise.all(promises)

      setAssets(images.reduce((acc, item) => Object.assign(acc, item), {}))
    }
    loadAssets()
  }, [textures])

  return assets
}

export const AssetsContext = React.createContext<Assets>({})
export const useAssetsContext = () => React.useContext(AssetsContext)
