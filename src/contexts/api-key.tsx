import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const STORAGE_KEY = "anthropic-api-key"

interface ApiKeyContextValue {
  apiKey: string
  setApiKey: (value: string) => void
  clearApiKey: () => void
  ready: boolean
}

const ApiKeyContext = createContext<ApiKeyContextValue | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setApiKeyState(stored)
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const setApiKey = useCallback((value: string) => {
    setApiKeyState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore
    }
  }, [])

  const clearApiKey = useCallback(() => {
    setApiKeyState("")
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey, ready }}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider")
  return ctx
}
