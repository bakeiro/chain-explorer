import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
} from "lucide-react"
import Skeleton from "./Skeleton"
import { fetchERC20Transfers } from "../lib/BlockchainApi"
import { useBlockchain, useRouter } from "../App"
import AddressWithLabel from "./AddressWithLabel"
import { BLOCKCHAIN_CONFIG } from "../lib/Constants"

const TRANSFERS_PER_PAGE = 20

export default function TokenTransfersContent({ address }) {
  const [transfers, setTransfers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [tokenFilter, setTokenFilter] = useState("all")
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [metadata, setMetadata] = useState(null)

  const { rpcUrl, getAddressLabel } = useBlockchain()
  const { navigate } = useRouter()

  const loadTransfers = async () => {
    if (!rpcUrl || !address) return
    try {
      const result = await fetchERC20Transfers(rpcUrl, address)
      setTransfers(result.transfers || [])
      setMetadata(result.metadata || null)
    } catch (error) {
      console.error("Error fetching token transfers:", error)
      setTransfers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTransfers()
  }, [rpcUrl, address])

  useEffect(() => {
    setCurrentPage(1)
  }, [tokenFilter])

  const uniqueTokens = useMemo(() => {
    const tokens = new Map()

    if (!Array.isArray(transfers)) return []

    transfers.forEach((transfer) => {
      const tokenAddress = transfer.tokenAddress?.toLowerCase()
      if (!tokenAddress) return

      if (!tokens.has(tokenAddress)) {
        const label = getAddressLabel(tokenAddress)
        tokens.set(tokenAddress, {
          address: transfer.tokenAddress,
          label: label || `${transfer.tokenAddress.slice(0, 8)}...${transfer.tokenAddress.slice(-6)}`,
          count: 1,
        })
      } else {
        tokens.get(tokenAddress).count++
      }
    })

    return Array.from(tokens.values()).sort((a, b) => b.count - a.count)
  }, [transfers, getAddressLabel])

  const filteredTransfers = useMemo(() => {
    if (!Array.isArray(transfers)) return []
    if (tokenFilter === "all") return transfers

    return transfers.filter((transfer) => transfer.tokenAddress?.toLowerCase() === tokenFilter.toLowerCase())
  }, [transfers, tokenFilter])

  const totalPages = Math.ceil(filteredTransfers.length / TRANSFERS_PER_PAGE)
  const startIndex = (currentPage - 1) * TRANSFERS_PER_PAGE
  const endIndex = startIndex + TRANSFERS_PER_PAGE
  const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex)

  const handleExportTransfers = () => {
    const totalToExport = filteredTransfers.length

    if (totalToExport > BLOCKCHAIN_CONFIG.TX_EXPORT_WARNING_THRESHOLD) {
      const proceed = window.confirm(
        `You are about to export ${totalToExport.toLocaleString()} token transfers. This may create a large file and take some time. Continue?`,
      )
      if (!proceed) return
    }

    const dataToExport = filteredTransfers.map((t) => ({
      hash: t.hash,
      logIndex: t.logIndex,
      blockNumber: t.blockNumber,
      tokenAddress: t.tokenAddress,
      from: t.from,
      to: t.to,
      value: t.value,
      formattedValue: t.formattedValue,
      type: t.type,
      timestamp: t.timestamp,
    }))

    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    const tokenName = tokenFilter === "all" ? "all_tokens" : tokenFilter.slice(0, 8)
    link.download = `token_transfers_${address.slice(0, 8)}_${tokenName}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setCurrentPage(1)
    loadTransfers()
  }

  const getCurrentTokenName = () => {
    if (tokenFilter === "all") return "All Tokens"
    const token = uniqueTokens.find((t) => t.address.toLowerCase() === tokenFilter.toLowerCase())
    return token ? token.label : tokenFilter.slice(0, 10) + "..."
  }

  return (
    <div className="card">
      <div className="card-header w-[100%]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="card-title text-lg">Token Transfers</h3>
            <span className="text-sm text-muted-foreground">
              ({filteredTransfers.length.toLocaleString()} transfers)
            </span>
            {metadata?.reachedLimit && (
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                Limit reached - more transfers may exist
              </span>
            )}
          </div>
          <div className="flex">
            <div className="relative">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="btn btn-outline btn-sm flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{getCurrentTokenName()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTokenDropdown ? "rotate-180" : ""}`} />
              </button>

              {showTokenDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTokenDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setTokenFilter("all")
                        setShowTokenDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                        tokenFilter === "all" ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      All Tokens
                    </button>
                    <div className="border-t border-border" />
                    {uniqueTokens.map((token) => (
                      <button
                        key={token.address}
                        onClick={() => {
                          setTokenFilter(token.address)
                          setShowTokenDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                          tokenFilter.toLowerCase() === token.address.toLowerCase()
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">{token.label}</span>
                          <span className="text-xs text-muted-foreground/70 ml-2">({token.count})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleExportTransfers}
              disabled={filteredTransfers.length === 0}
              className="btn btn-outline btn-sm ml-4"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>

            <button onClick={handleRefresh} disabled={isLoading} className="ml-4 btn btn-outline btn-sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Loading" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
      <div className="card-content">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {!isLoading && (!filteredTransfers || filteredTransfers.length === 0) && (
          <div className="text-center py-8">
            <Coins className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No token transfers found</p>
          </div>
        )}

        {!isLoading && filteredTransfers && filteredTransfers.length > 0 && (
          <>
            <div className="space-y-4">
              {paginatedTransfers.map((transfer, index) => (
                <div
                  key={`${transfer.hash}-${transfer.logIndex}-${index}`}
                  onClick={() => navigate("transaction-detail", { hash: transfer.hash })}
                  className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-border"
                >
                  {/* Header con badge y hash */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${transfer.type === "send" ? "badge-destructive" : "badge-default"}`}>
                        {transfer.type === "send" ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            OUT
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                            IN
                          </>
                        )}
                      </span>
                      <code className="text-sm text-muted-foreground">{transfer.hash}</code>
                    </div>
                    <span className="text-sm text-muted-foreground">{transfer.timeAgo}</span>
                  </div>

                  {/* Lista de campos */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-muted-foreground w-32 shrink-0 text-sm">Token:</span>
                      <div className="flex-1 min-w-0">
                        <AddressWithLabel address={transfer.tokenAddress} truncate={false} />
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-muted-foreground w-32 shrink-0 text-sm">From:</span>
                      <div className="flex-1 min-w-0">
                        <AddressWithLabel address={transfer.from} truncate={false} />
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-muted-foreground w-32 shrink-0 text-sm">To:</span>
                      <div className="flex-1 min-w-0">
                        <AddressWithLabel address={transfer.to} truncate={false} />
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-muted-foreground w-32 shrink-0 text-sm">Amount:</span>
                      <span className="font-semibold">{transfer.formattedValue}</span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-muted-foreground w-32 shrink-0 text-sm">Token Decimals:</span>
                      <span className="font-mono">{transfer.decimals ?? "18"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} - {Math.min(endIndex, filteredTransfers.length)} of{" "}
                  {filteredTransfers.length.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
