 

import { useState, useEffect } from "react"
import { useBlockchain } from "../App"
import { fetchStats } from "../lib/BlockchainApi"
import { Activity, AlertCircle } from "lucide-react"
import Skeleton from "./Skeleton"

export default function NetworkStatus() {
  const { rpcUrl } = useBlockchain()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!rpcUrl) return

    const loadStats = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const data = await fetchStats(rpcUrl)
        setStats(data)
      } catch (error) {
        console.error("Error fetching network status:", error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [rpcUrl])

  if (isLoading) {
    return (
      <div className="card p-8 bg-gradient-to-br from-[oklch(0.65_0.25_151)]/5 to-[oklch(0.65_0.25_151)]/10 border-[oklch(0.65_0.25_151)]/30">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isConnected = !isError && stats

  return (
    <div className="card p-8 bg-gradient-to-br from-[oklch(0.65_0.25_151)]/10 to-[oklch(0.65_0.25_151)]/5 border-[oklch(0.65_0.25_151)]/30 shadow-lg shadow-[oklch(0.65_0.25_151)]/5">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? "bg-[oklch(0.65_0.25_151)]/25" : "bg-destructive/20"}`}
          >
            {isConnected ? (
              <Activity className="w-6 h-6 text-[oklch(0.65_0.25_151)]" />
            ) : (
              <AlertCircle className="w-6 h-6 text-destructive" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Network Status</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? "All systems operational" : "Unable to connect to RPC provider"}
            </p>
          </div>
          {isConnected && (
            <div className="ml-auto">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold border-[oklch(0.65_0.25_151)]/30 bg-[oklch(0.65_0.25_151)]/15 text-[oklch(0.65_0.25_151)]">
                <div className="w-2 h-2 rounded-full mr-2 bg-[oklch(0.65_0.25_151)] animate-pulse" />
                Online
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">RPC Endpoint</p>
            <code className="text-sm font-mono bg-[oklch(0.65_0.25_151)]/10 px-3 py-2 rounded-md block truncate border text-muted-foreground border-[oklch(0.65_0.25_151)]/20">
              {rpcUrl}
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Network Health</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-[oklch(0.65_0.25_151)] animate-pulse" : "bg-destructive"}`}
              />
              <span
                className={`text-sm font-medium ${isConnected ? "text-[oklch(0.65_0.25_151)]" : "text-destructive"}`}
              >
                {isConnected ? "Excellent" : "Connection Failed"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 pt-4">
          <div className="flex items-center gap-3 p-3 bg-[oklch(0.65_0.25_151)]/10 rounded-lg border border-[oklch(0.65_0.25_151)]/20">
            <Activity className="w-5 h-5 text-[oklch(0.65_0.25_151)]" />
            <div>
              <p className="text-xs text-muted-foreground">Chain ID</p>
              <p className="text-lg font-bold text-white">{stats?.chainId || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
