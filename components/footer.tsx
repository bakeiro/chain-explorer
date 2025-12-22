"use client"

import { useBlockchain } from "@/contexts/blockchain-context"

export function Footer() {
  const { rpcUrl } = useBlockchain()

  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">© 2025 ChainExplorer. Connected to {rpcUrl}</div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
