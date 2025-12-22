"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Activity, AlertCircle } from "lucide-react"
import { useBlockchain } from "@/contexts/blockchain-context"
import { fetchStats } from "@/lib/blockchain-api"
import { Skeleton } from "@/components/ui/skeleton"

export function NetworkStatus() {
  const { rpcUrl } = useBlockchain()

  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["network-status", rpcUrl],
    queryFn: () => fetchStats(rpcUrl!),
    enabled: !!rpcUrl,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })

  if (isLoading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </Card>
    )
  }

  const isConnected = !isError && stats

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? "bg-primary/20" : "bg-destructive/20"}`}
          >
            {isConnected ? (
              <Activity className="w-6 h-6 text-primary" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">RPC Endpoint</p>
            <code className="text-sm font-mono text-foreground bg-background/50 px-3 py-2 rounded-md block truncate">
              {rpcUrl}
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Network Health</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary animate-pulse" : "bg-destructive"}`} />
              <span className="text-sm font-medium text-foreground">
                {isConnected ? "Excellent" : "Connection Failed"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 pt-4">
          <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Chain ID</p>
              <p className="text-lg font-bold text-foreground">{stats?.chainId || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
