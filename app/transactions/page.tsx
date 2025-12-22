"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, RefreshCw, Copy, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useBlockchain } from "@/contexts/blockchain-context"
import { fetchTransactions } from "@/lib/blockchain-api"
import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RpcConnector } from "@/components/rpc-connector"

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { rpcUrl, isConnected } = useBlockchain()

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", rpcUrl],
    queryFn: () => fetchTransactions(rpcUrl!),
    enabled: !!rpcUrl,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ["transactions", rpcUrl] })
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Check if it's a transaction hash
    if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
      router.push(`/transaction/${searchQuery}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  if (!isConnected) {
    return <RpcConnector />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Search Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Transactions Explorer</h1>
            <p className="text-lg text-muted-foreground text-balance">
              Search and explore transactions on the blockchain
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by transaction hash or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-base bg-card border-border"
              />
            </div>
          </form>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-sm text-muted-foreground">Latest activity on the blockchain</p>
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
                        Transaction Hash
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        From
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        To
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Amount
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Time
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Status
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
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-5 w-16" />
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
                        Transaction Hash
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        From
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        To
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Amount
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Time
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions?.map((tx, index) => (
                      <tr
                        key={index}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/transaction/${tx.hash}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-foreground">{truncateHash(tx.hash)}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(tx.hash)
                              }}
                            >
                              <Copy
                                className={`h-3 w-3 ${copiedHash === tx.hash ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono text-muted-foreground">{truncateHash(tx.from)}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono text-muted-foreground">{truncateHash(tx.to)}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {tx.type === "send" ? (
                              <ArrowUpRight className="w-4 h-4 text-destructive" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-primary" />
                            )}
                            <span className="text-sm font-medium text-foreground">{tx.amount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{tx.timeAgo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              tx.status === "success"
                                ? "default"
                                : tx.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              tx.status === "success"
                                ? "bg-primary/20 text-primary border-primary/50"
                                : tx.status === "pending"
                                  ? "bg-muted text-muted-foreground border-border"
                                  : "bg-destructive/20 text-destructive border-destructive/50"
                            }
                          >
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/transaction/${tx.hash}`)
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

      <Footer />
    </div>
  )
}
