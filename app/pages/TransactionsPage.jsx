 

import { useState, useEffect } from "react"
import { useBlockchain, useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Skeleton from "../components/Skeleton"
import { fetchTransactions } from "../lib/BlockchainApi"
import { Search, RefreshCw, Copy, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedHash, setCopiedHash] = useState(null)
  const { rpcUrl } = useBlockchain()
  const { navigate } = useRouter()

  const loadTransactions = async () => {
    if (!rpcUrl) return
    try {
      const data = await fetchTransactions(rpcUrl)
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [rpcUrl])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadTransactions()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
      navigate("transaction-detail", { hash: searchQuery })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const truncateHash = (hash) => `${hash.slice(0, 8)}...${hash.slice(-6)}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
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
              <input
                type="text"
                placeholder="Search by transaction hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-lg pl-12 pr-4 w-full"
              />
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-sm text-muted-foreground">Latest activity on the blockchain</p>
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
                    <th className="table-head">Transaction Hash</th>
                    <th className="table-head">From</th>
                    <th className="table-head">To</th>
                    <th className="table-head">Amount</th>
                    <th className="table-head">Time</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading
                    ? [...Array(6)].map((_, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="table-cell">
                            <Skeleton className="h-5 w-16" />
                          </td>
                          <td className="table-cell text-right">
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </td>
                        </tr>
                      ))
                    : transactions.map((tx, index) => (
                        <tr
                          key={index}
                          className="table-row cursor-pointer"
                          onClick={() => navigate("transaction-detail", { hash: tx.hash })}
                        >
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-foreground">{truncateHash(tx.hash)}</code>
                              <button
                                className="btn btn-ghost btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(tx.hash)
                                }}
                              >
                                <Copy
                                  className={`h-3 w-3 ${copiedHash === tx.hash ? "text-primary" : "text-muted-foreground"}`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="table-cell">
                            <code className="text-sm font-mono text-muted-foreground">{truncateHash(tx.from)}</code>
                          </td>
                          <td className="table-cell">
                            <code className="text-sm font-mono text-muted-foreground">{truncateHash(tx.to)}</code>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              {tx.type === "send" ? (
                                <ArrowUpRight className="w-4 h-4 text-destructive" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-primary" />
                              )}
                              <span className="text-sm font-medium text-foreground">{tx.amount}</span>
                            </div>
                          </td>
                          <td className="table-cell text-sm text-muted-foreground">{tx.timeAgo}</td>
                          <td className="table-cell">
                            <span
                              className={`badge ${
                                tx.status === "success"
                                  ? "badge-default"
                                  : tx.status === "pending"
                                    ? "badge-secondary"
                                    : "badge-destructive"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <button
                              className="btn btn-ghost btn-sm text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate("transaction-detail", { hash: tx.hash })
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
