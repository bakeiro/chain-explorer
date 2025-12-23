"use client"

import { useState, useEffect } from "react"
import { useBlockchain } from "../App"
import { fetchStats } from "../lib/BlockchainApi"
import { Blocks, Activity, Zap, Clock } from "lucide-react"
import Skeleton from "./Skeleton"

export default function StatsCards() {
  const { rpcUrl } = useBlockchain()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!rpcUrl) return

    const loadStats = async () => {
      setIsLoading(true)
      try {
        const data = await fetchStats(rpcUrl)
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [rpcUrl])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statsDisplay = [
    {
      icon: Blocks,
      label: "Total Blocks",
      value: stats?.totalBlocks?.toLocaleString() || "0",
    },
    {
      icon: Activity,
      label: "Transactions",
      value: stats?.totalTransactions?.toLocaleString() || "0",
    },
    {
      icon: Zap,
      label: "TPS",
      value: stats?.tps || "0",
    },
    {
      icon: Clock,
      label: "Block Time",
      value: stats?.avgBlockTime || "N/A",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsDisplay.map((stat, index) => (
        <div
          key={index}
          className="card p-6 border-[oklch(0.65_0.25_151)]/10 hover:border-[oklch(0.65_0.25_151)]/40 hover:shadow-lg hover:shadow-[oklch(0.65_0.25_151)]/10 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[oklch(0.65_0.25_151)]/15 flex items-center justify-center">
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
