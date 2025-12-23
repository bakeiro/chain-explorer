 

import { useState, useEffect } from "react"
import { useBlockchain, useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Skeleton from "../components/Skeleton"
import { fetchBlockById } from "../lib/BlockchainApi"
import { ArrowLeft, Copy } from "lucide-react"

export default function BlockDetailPage({ blockNumber }) {
  const [block, setBlock] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedField, setCopiedField] = useState(null)
  const { rpcUrl } = useBlockchain()
  const { goBack } = useRouter()

  useEffect(() => {
    const loadBlock = async () => {
      if (!rpcUrl || !blockNumber) return
      try {
        const data = await fetchBlockById(rpcUrl, blockNumber)
        setBlock(data)
      } catch (error) {
        console.error("Error fetching block:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadBlock()
  }, [rpcUrl, blockNumber])

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavBar />

      <main className="container mx-auto px-4 lg:px-8 py-8 flex-1">
        <button onClick={goBack} className="btn btn-ghost mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {isLoading ? (
          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="card p-6">
              <div className="space-y-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex justify-between items-start py-3 border-b border-border last:border-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : block ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Block #{block.number}</h1>
              <p className="text-muted-foreground">View detailed information about this block</p>
            </div>

            <div className="card p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Block Number</span>
                  <span className="badge badge-outline font-mono text-sm">{block.number}</span>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Block Hash</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">{block.hash}</code>
                    <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(block.hash, "hash")}>
                      <Copy
                        className={`h-3 w-3 ${copiedField === "hash" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
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
                    <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(block.miner, "miner")}>
                      <Copy
                        className={`h-3 w-3 ${copiedField === "miner" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
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
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-lg text-muted-foreground">Block not found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
