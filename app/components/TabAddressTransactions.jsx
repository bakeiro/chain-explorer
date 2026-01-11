import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react"
import Skeleton from "./Skeleton"
import { extractFunctionSelector, findMatchingFunction } from "../lib/AbiDecoder"
import { fetchAddressTransactions } from "../lib/BlockchainApi"
import { useBlockchain, useRouter } from "../App"
import DecodedTransactionInput from "./DecodedTransactionInput"
import { BLOCKCHAIN_CONFIG } from "../lib/Constants"

const TRANSACTIONS_PER_PAGE = 20

export default function TransactionsContent({ address }) {
  const [transactions, setTransactions] = useState([])
  const [isLoadingTxs, setIsLoadingTxs] = useState(true)
  const [methodFilter, setMethodFilter] = useState("all")
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [metadata, setMetadata] = useState(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentLimit, setCurrentLimit] = useState(BLOCKCHAIN_CONFIG.DEFAULT_TX_LOAD_LIMIT)

  const { rpcUrl, getContractABI, getAddressLabel } = useBlockchain()
  const { navigate } = useRouter()
  const [parsedABI, setParsedABI] = useState(null)

  const loadTransactions = async (limit = currentLimit) => {
    if (!rpcUrl || !address) return
    try {
      const result = await fetchAddressTransactions(rpcUrl, address, { limit })
      setTransactions(result.transactions)
      setMetadata(result.metadata)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoadingTxs(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = async () => {
    const newLimit = Math.min(
      currentLimit + BLOCKCHAIN_CONFIG.DEFAULT_TX_LOAD_LIMIT,
      BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT,
    )

    if (newLimit >= BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT) {
      const proceed = window.confirm(
        `You are about to load up to ${BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT} transactions. This may take a while and use significant resources. Continue?`,
      )
      if (!proceed) return
    }

    setIsLoadingMore(true)
    setCurrentLimit(newLimit)
    await loadTransactions(newLimit)
  }

  useEffect(() => {
    const savedABI = getContractABI(address)
    if (savedABI) {
      setParsedABI(savedABI)
    }
  }, [address, getContractABI])

  useEffect(() => {
    loadTransactions()
  }, [rpcUrl, address])

  useEffect(() => {
    setCurrentPage(1)
  }, [methodFilter])

  const uniqueMethods = useMemo(() => {
    const methods = new Map()

    transactions.forEach((tx) => {
      if (!tx.input || tx.input === "0x") {
        methods.set("transfer", {
          name: "Transfer (Native)",
          selector: "transfer",
        })
        return
      }

      const selector = extractFunctionSelector(tx.input)
      if (!selector) return

      const contractABI = tx.to ? getContractABI(tx.to) : null
      const matchingFunction = contractABI ? findMatchingFunction(contractABI, selector) : null

      if (matchingFunction) {
        methods.set(selector, { name: matchingFunction.name, selector })
      } else {
        methods.set(selector, { name: selector, selector })
      }
    })

    return Array.from(methods.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [transactions, getContractABI])

  const filteredTransactions = useMemo(() => {
    if (methodFilter === "all") return transactions

    return transactions.filter((tx) => {
      if (methodFilter === "transfer") {
        return !tx.input || tx.input === "0x"
      }

      const selector = extractFunctionSelector(tx.input)
      return selector === methodFilter
    })
  }, [transactions, methodFilter])

  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE
  const endIndex = startIndex + TRANSACTIONS_PER_PAGE
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  const handleExportTransactions = () => {
    const totalToExport = filteredTransactions.length

    if (totalToExport > BLOCKCHAIN_CONFIG.TX_EXPORT_WARNING_THRESHOLD) {
      const proceed = window.confirm(
        `You are about to export ${totalToExport.toLocaleString()} transactions. This may create a large file and take some time. Continue?`,
      )
      if (!proceed) return
    }

    const dataToExport = filteredTransactions.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      input: tx.input,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      status: tx.status,
    }))

    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    const methodName = methodFilter === "all" ? "all" : getCurrentMethodName().replace(/[^a-zA-Z0-9]/g, "_")
    link.download = `transactions_${address.slice(0, 8)}_${methodName}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleRefreshTransactions = () => {
    setIsLoadingTxs(true)
    setCurrentPage(1)
    loadTransactions()
  }

  const getCurrentMethodName = () => {
    if (methodFilter === "all") return "All Methods"
    const method = uniqueMethods.find((m) => m.selector === methodFilter)
    return method ? method.name : methodFilter
  }

  return (
    <div className="card">
      <div className="card-header w-[100%]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="card-title text-lg">Transaction History</h3>
            {metadata && (
              <span className="text-sm text-muted-foreground">
                ({filteredTransactions.length.toLocaleString()} transactions)
              </span>
            )}
          </div>
          <div className="flex">
            <div className="relative">
              <button
                onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                className="btn btn-outline btn-sm flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{getCurrentMethodName()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMethodDropdown ? "rotate-180" : ""}`} />
              </button>

              {showMethodDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMethodDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setMethodFilter("all")
                        setShowMethodDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                        methodFilter === "all" ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      All Methods
                    </button>
                    <div className="border-t border-border" />
                    {uniqueMethods.map((method) => (
                      <button
                        key={method.selector}
                        onClick={() => {
                          setMethodFilter(method.selector)
                          setShowMethodDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                          methodFilter === method.selector
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="block truncate">{method.name}</span>
                        {method.name !== method.selector && (
                          <span className="text-xs text-muted-foreground/70">{method.selector}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleExportTransactions}
              disabled={filteredTransactions.length === 0}
              className="btn btn-outline btn-sm ml-4"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>

            <button onClick={handleRefreshTransactions} disabled={isLoadingTxs} className="ml-4 btn btn-outline btn-sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTxs ? "animate-spin" : ""}`} />
              {isLoadingTxs ? "Loading" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
      <div className="card-content">
        {isLoadingTxs && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoadingTxs && (!filteredTransactions || filteredTransactions.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}

        {!isLoadingTxs && filteredTransactions && filteredTransactions.length > 0 && (
          <>
            <div className="space-y-3">
              {paginatedTransactions.map((tx) => (
                <div key={tx.hash} className="space-y-3">
                  <div
                    onClick={() => navigate("transaction-detail", { hash: tx.hash })}
                    className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${tx.type === "send" ? "badge-destructive" : "badge-default"}`}>
                            {tx.type === "send" ? "OUT" : "IN"}
                          </span>
                          <code className="text-sm text-muted-foreground truncate">{tx.hash}</code>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">From:</span>
                            <code className="text-sm">{tx.from.slice(0, 10)}...</code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">To:</span>
                            <code className="text-sm">{tx.to.slice(0, 10)}...</code>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-semibold">{tx.amount}</div>
                        <div className="text-sm text-muted-foreground">{tx.timeAgo}</div>
                      </div>
                    </div>

                    {parsedABI && tx.input && tx.input !== "0x" && (
                      <div className="mt-3 pt-3 border-t border-border-500" onClick={(e) => e.stopPropagation()}>
                        <DecodedTransactionInput inputData={tx.input} abi={parsedABI} inline />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length.toLocaleString()}
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

            {metadata?.reachedLimit && currentLimit < BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Showing first {transactions.length.toLocaleString()} transactions. There may be more transactions in
                  older blocks.
                </p>
                <button onClick={handleLoadMore} disabled={isLoadingMore} className="btn btn-outline btn-sm">
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    `Load more (up to ${Math.min(currentLimit + BLOCKCHAIN_CONFIG.DEFAULT_TX_LOAD_LIMIT, BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT).toLocaleString()})`
                  )}
                </button>
              </div>
            )}

            {currentLimit >= BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT && metadata?.reachedLimit && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Maximum limit of {BLOCKCHAIN_CONFIG.MAX_TX_LOAD_LIMIT.toLocaleString()} transactions reached. Use the
                  method filter or export to JSON for further analysis.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
