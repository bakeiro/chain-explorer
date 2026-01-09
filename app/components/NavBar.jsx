import { useBlockchain, useRouter, useTheme } from "../App"
import { Blocks, Plug, Sun, Moon } from "lucide-react"

export default function NavBar() {
  const { disconnect } = useBlockchain()
  const { currentPage, navigate } = useRouter()
  const { isDark, toggleTheme } = useTheme()

  const isActive = (page) => {
    if (page === "home") return currentPage === "home"
    return currentPage === page || currentPage === `${page.slice(0, -1)}-detail`
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[oklch(0.65_0.25_151)]">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">ChainExplorer</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("transactions")}
              className={`text-sm transition-colors cursor-pointer ${
                isActive("transactions") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => navigate("blocks")}
              className={`text-sm transition-colors cursor-pointer ${
                isActive("blocks") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => navigate("addresses")}
              className={`text-sm transition-colors cursor-pointer ${
                 isActive("addresses") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Addresses
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark
                ? (<Sun className="w-4 h-4 text-muted-foreground hover:text-foreground" />)
                : (<Moon className="w-4 h-4 text-muted-foreground hover:text-foreground" />)
              }
            </button>
            
            <span className="text-xs hidden md:flex items-center rounded-full border px-2.5 py-0.5 font-semibold border-[oklch(0.65_0.25_151)]/30 bg-[oklch(0.65_0.25_151)]/15 text-[oklch(0.65_0.25_151)]">
              <div className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse bg-[oklch(0.65_0.25_151)]" />
              Connected
            </span>
            <button onClick={disconnect} className="cursor-pointer btn btn-outline btn-sm">
              <Plug className="w-3 h-3 mr-1.5" />
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
