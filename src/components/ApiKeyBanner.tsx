import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApiKey } from "@/contexts/api-key"
import { SettingsDialog } from "./Settings"

export function ApiKeyBanner() {
  const { apiKey, ready } = useApiKey()
  const [open, setOpen] = useState(false)
  if (!ready || apiKey) return null
  return (
    <>
      <div className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="flex-1">
          Add your Anthropic API key to start chatting.
        </span>
        <Button size="sm" onClick={() => setOpen(true)}>
          Add key
        </Button>
      </div>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
