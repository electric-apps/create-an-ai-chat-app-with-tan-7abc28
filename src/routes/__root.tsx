import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import appCss from "../styles.css?url"
import { ClientOnly } from "@/components/ClientOnly"
import { ApiKeyProvider } from "@/contexts/api-key"
import { Sidebar } from "@/components/Sidebar"
import { ApiKeyBanner } from "@/components/ApiKeyBanner"
import { Toaster } from "@/components/ui/sonner"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Chat" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <ClientOnly>{() => (
        <ApiKeyProvider>
          <div className="flex h-screen w-screen overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <ApiKeyBanner />
              <Outlet />
            </div>
            <Toaster richColors position="bottom-right" />
          </div>
        </ApiKeyProvider>
      )}
    </ClientOnly>
  )
}
