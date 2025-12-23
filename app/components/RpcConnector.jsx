"use client"

import { useState } from "react"
import { useBlockchain } from "../App"
import { Blocks, Plug } from "lucide-react"

export default function RpcConnector() {
  const [inputUrl, setInputUrl] = useState("")
  const [error, setError] = useState("")
  const { setRpcUrl } = useBlockchain()

  const isValidUrl = (url) => {
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
          <div className="w-16 h-16 bg-[oklch(0.65_0.25_151)] rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-[oklch(0.65_0.25_151)]/20">
            <Blocks className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold ">
            ChainExplorer
          </h1>
          <p className="text-muted-foreground text-balance">
            Connect to your blockchain node to start exploring transactions and blocks
          </p>
        </div>

        <div className="space-y-4 p-6 rounded-xl border border-[oklch(0.65_0.25_151)]/20 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <label htmlFor="rpc-url" className="text-sm font-medium text-foreground">
              RPC URL
            </label>
            <input
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
              className="input input-lg w-full"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <button
            onClick={handleConnect}
            disabled={!inputUrl.trim()}
            className="btn btn-primary btn-lg w-full shadow-lg shadow-[oklch(0.65_0.25_151)]/20"
          >
            <Plug className="w-4 h-4 mr-2" />
            Connect to Node
          </button>
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
