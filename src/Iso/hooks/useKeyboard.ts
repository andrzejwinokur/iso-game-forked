import * as React from "react"

type KeyPressCallback = () => void
type KeyPresses = { [key: string]: KeyPressCallback }

export function useKeyboard(
  actions: KeyPresses = {}
  // listenKeys?: string[]
) {
  const handleKeyPress = React.useCallback(
    (event: KeyboardEvent) => {
      if (actions[event.key]) {
        actions[event.key]()
      }
    },
    [actions]
  )

  React.useEffect(() => {
    // document.body.addEventListener('keydown', setKeyDown)
    // document.body.addEventListener('keyup', setKeyUp)
    document.body.addEventListener("keypress", handleKeyPress)
    return () => {
      // document.body.removeEventListener('keydown', setKeyDown)
      // document.body.removeEventListener('keyup', setKeyUp)
      document.body.removeEventListener("keypress", handleKeyPress)
    }
  }, [handleKeyPress])
}
