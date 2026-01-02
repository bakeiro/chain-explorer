 

import { useState, useEffect } from "react"
import { useBlockchain, useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Skeleton from "../components/Skeleton"
import { fetchBlocks } from "../lib/BlockchainApi"
import { Search, RefreshCw, Copy, ExternalLink } from "lucide-react"

export default function BlocksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [blocks, setBlocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedHash, setCopiedHash] = useState(null)
  const { rpcUrl } = useBlockchain()
  const { navigate } = useRouter()

  const loadBlocks = async () => {
    if (!rpcUrl) return
    try {
      const data = await fetchBlocks(rpcUrl)
      setBlocks(data)
    } catch (error) {
      console.error("Error fetching blocks:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadBlocks()
  }, [rpcUrl])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadBlocks()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    if (/^\d+$/.test(searchQuery)) {
      navigate("block-detail", { blockNumber: Number.parseInt(searchQuery) })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const truncateHash = (hash) => `${hash.slice(0, 10)}...${hash.slice(-8)}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <main className="container mx-auto px-4 lg:px-24 py-8 space-y-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Blocks Explorer</h1>
            <p className="text-lg text-muted-foreground text-balance">Explore all blocks mined on the blockchain</p>
          </div>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by block number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-lg pl-14 pr-4 w-full"
              />
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Recent Blocks</h2>
              <p className="text-sm text-muted-foreground">Latest blocks mined on the blockchain</p>
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing} className="btn btn-outline btn-sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr className="border-b border-border">
                    <th className="table-head">Block</th>
                    <th className="table-head">Hash</th>
                    <th className="table-head">Miner</th>
                    <th className="table-head">Txns</th>
                    <th className="table-head">Gas Used</th>
                    <th className="table-head">Reward</th>
                    <th className="table-head">Time</th>
                    <th className="table-head text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading
                    ? [...Array(6)].map((_, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-12" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="table-cell text-right">
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </td>
                        </tr>
                      ))
                    : blocks.map((block, index) => (
                        <tr
                          key={index}
                          className="table-row cursor-pointer"
                          onClick={() => navigate("block-detail", { blockNumber: block.number })}
                        >
                          <td className="table-cell">
                            <span className="badge badge-outline font-mono text-xs">{block.number}</span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-foreground">{truncateHash(block.hash)}</code>
                              <button
                                className="btn btn-ghost btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(block.hash)
                                }}
                              >
                                <Copy
                                  className={`h-3 w-3 ${copiedHash === block.hash ? "text-primary" : "text-muted-foreground"}`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="table-cell">
                            <code className="text-sm font-mono text-muted-foreground">{truncateHash(block.miner)}</code>
                          </td>
                          <td className="table-cell">
                            <span className="text-sm font-medium text-foreground">{block.transactions}</span>
                          </td>
                          <td className="table-cell">
                            <span className="text-sm text-muted-foreground">{block.gasUsed}</span>
                          </td>
                          <td className="table-cell">
                            <span className="text-sm font-medium text-primary">{block.reward}</span>
                          </td>
                          <td className="table-cell text-sm text-muted-foreground">{block.timeAgo}</td>
                          <td className="table-cell text-right">
                            <button
                              className="btn btn-ghost btn-sm text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate("block-detail", { blockNumber: block.number })
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}