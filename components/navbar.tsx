"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Blocks, Plug } from "lucide-react"
import { useBlockchain } from "@/contexts/blockchain-context"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { rpcUrl, disconnect } = useBlockchain()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Blocks className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">ChainExplorer</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/transactions"
              className={`text-sm transition-colors ${
                isActive("/transactions") || pathname.startsWith("/transaction/")
                  ? "text-foreground hover:text-foreground/80 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Transactions
            </Link>
            <Link
              href="/blocks"
              className={`text-sm transition-colors ${
                isActive("/blocks") || pathname.startsWith("/block/")
                  ? "text-foreground hover:text-foreground/80 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blocks
            </Link>
            <Link
              href="/addresses"
              className={`text-sm transition-colors ${
                isActive("/addresses") || pathname.startsWith("/address/")
                  ? "text-foreground hover:text-foreground/80 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Addresses
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-primary/50 text-primary hidden md:flex">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 animate-pulse" />
              Connected
            </Badge>
            <Button onClick={disconnect} variant="outline" size="sm" className="cursor-pointer bg-transparent">
              <Plug className="w-3 h-3 mr-1.5" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
