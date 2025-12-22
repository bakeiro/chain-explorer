"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Blocks, Activity, Zap, Clock } from "lucide-react"
import { useBlockchain } from "@/contexts/blockchain-context"
import { fetchStats } from "@/lib/blockchain-api"
import { Skeleton } from "@/components/ui/skeleton"

export function StatsCards() {
  const { rpcUrl } = useBlockchain()

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", rpcUrl],
    queryFn: () => fetchStats(rpcUrl!),
    enabled: !!rpcUrl,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const statsDisplay = [
    {
      icon: Blocks,
      label: "Total Blocks",
      value: stats?.totalBlocks.toLocaleString() || "0",
      change: "+12.5%",
      positive: true,
    },
    {
      icon: Activity,
      label: "Transactions",
      value: stats?.totalTransactions.toLocaleString() || "0",
      change: "+8.2%",
      positive: true,
    },
    {
      icon: Zap,
      label: "TPS",
      value: stats?.tps || "0",
      change: "+5.3%",
      positive: true,
    },
    {
      icon: Clock,
      label: "Block Time",
      value: stats?.avgBlockTime || "N/A",
      change: "-0.2s",
      positive: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsDisplay.map((stat, index) => (
        <Card key={index} className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
