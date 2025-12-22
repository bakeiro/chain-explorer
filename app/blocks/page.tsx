"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { useBlockchain } from "@/contexts/blockchain-context"
import { fetchBlocks } from "@/lib/blockchain-api"
import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RpcConnector } from "@/components/rpc-connector"

export default function BlocksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { rpcUrl, isConnected } = useBlockchain()

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["blocks", rpcUrl],
    queryFn: () => fetchBlocks(rpcUrl!),
    enabled: !!rpcUrl,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ["blocks", rpcUrl] })
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Check if it's a block number
    if (/^\d+$/.test(searchQuery)) {
      router.push(`/block/${searchQuery}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  if (!isConnected) {
    return <RpcConnector />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Search Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Blocks Explorer</h1>
            <p className="text-lg text-muted-foreground text-balance">Explore all blocks mined on the blockchain</p>
          </div>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by block number or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-base bg-card border-border"
              />
            </div>
          </form>
        </div>

        {/* Recent Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Recent Blocks</h2>
              <p className="text-sm text-muted-foreground">Latest blocks mined on the blockchain</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="cursor-pointer bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <Card className="bg-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Block
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Hash
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Miner
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Txns
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Gas Used
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Reward
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Time
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...Array(6)].map((_, index) => (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="bg-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Block
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Hash
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Miner
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Txns
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Gas Used
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Reward
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Time
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {blocks?.map((block, index) => (
                      <tr
                        key={index}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/block/${block.number}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs border-primary/50 text-primary">
                              {block.number}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-foreground">{truncateHash(block.hash)}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(block.hash)
                              }}
                            >
                              <Copy
                                className={`h-3 w-3 ${copiedHash === block.hash ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono text-muted-foreground">{truncateHash(block.miner)}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-foreground">{block.transactions}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">{block.gasUsed}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-primary">{block.reward}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{block.timeAgo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/block/${block.number}`)
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
