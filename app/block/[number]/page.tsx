"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useBlockchain } from "@/contexts/blockchain-context"
import { RpcConnector } from "@/components/rpc-connector"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Copy } from "lucide-react"
import { fetchBlockById } from "@/lib/blockchain-api"
import { useState } from "react"

export default function BlockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const number = Number.parseInt(params.number as string)
  const { isConnected, rpcUrl } = useBlockchain()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: block, isLoading } = useQuery({
    queryKey: ["block", number, rpcUrl],
    queryFn: () => fetchBlockById(rpcUrl!, number),
    enabled: isConnected && !!rpcUrl,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!isConnected) {
    return <RpcConnector />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8 flex-1">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Card className="p-6">
              <div className="space-y-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex justify-between items-start py-3 border-b border-border last:border-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : block ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Block #{block.number}</h1>
              <p className="text-muted-foreground">View detailed information about this block</p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Block Number</span>
                  <Badge variant="outline" className="font-mono text-sm border-primary/50 text-primary">
                    {block.number}
                  </Badge>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Block Hash</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">{block.hash}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      onClick={() => copyToClipboard(block.hash, "hash")}
                    >
                      <Copy
                        className={`h-3 w-3 ${copiedField === "hash" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Timestamp</span>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{block.timeAgo}</p>
                    <p className="text-xs text-muted-foreground">{block.timestamp}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Transactions</span>
                  <span className="text-sm font-medium text-foreground">{block.transactions} txns</span>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Miner</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">{block.miner}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      onClick={() => copyToClipboard(block.miner, "miner")}
                    >
                      <Copy
                        className={`h-3 w-3 ${copiedField === "miner" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Gas Used</span>
                  <span className="text-sm text-foreground">{block.gasUsed}</span>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Gas Limit</span>
                  <span className="text-sm text-foreground">{block.gasLimit}</span>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Block Size</span>
                  <span className="text-sm text-foreground">{block.size}</span>
                </div>

                <div className="flex justify-between items-start py-3">
                  <span className="text-sm font-medium text-muted-foreground">Block Reward</span>
                  <span className="text-sm font-medium text-primary">{block.reward}</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">Block not found</p>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
