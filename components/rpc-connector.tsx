"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Blocks, Plug } from "lucide-react"
import { useBlockchain } from "@/contexts/blockchain-context"

export function RpcConnector() {
  const [inputUrl, setInputUrl] = useState("")
  const [error, setError] = useState("")
  const { setRpcUrl } = useBlockchain()

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  }

  const handleConnect = () => {
    const trimmedUrl = inputUrl.trim()

    if (!trimmedUrl) {
      setError("Please enter an RPC URL")
      return
    }

    if (!isValidUrl(trimmedUrl)) {
      setError("Please enter a valid URL (must start with http:// or https://)")
      return
    }

    setError("")
    setRpcUrl(trimmedUrl)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto">
            <Blocks className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ChainExplorer</h1>
          <p className="text-muted-foreground text-balance">
            Connect to your blockchain node to start exploring transactions and blocks
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="rpc-url" className="text-sm font-medium text-foreground">
              RPC URL
            </label>
            <Input
              id="rpc-url"
              type="text"
              placeholder="http://127.0.0.1:8545/"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConnect()
                }
              }}
              className="h-12 bg-card border-border"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button onClick={handleConnect} disabled={!inputUrl.trim()} className="w-full h-12 cursor-pointer" size="lg">
            <Plug className="w-4 h-4 mr-2" />
            Connect to Node
          </Button>
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Enter your blockchain node RPC endpoint to begin. Common endpoints include local nodes, Infura, Alchemy, or
            other providers.
          </p>
        </div>
      </div>
    </div>
  )
}
