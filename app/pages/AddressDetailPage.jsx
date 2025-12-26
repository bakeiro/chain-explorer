import { useState, useEffect } from "react"
import { useBlockchain, useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Skeleton from "../components/Skeleton"
import Tabs from "../components/Tabs"
import ContractInteraction from "../components/ContractInteraction"
import DecodedTransactionInput from "../components/DecodedTransactionInput"
import { fetchAddressByAddress, fetchAddressTransactions } from "../lib/BlockchainApi"
import { Copy, Wallet, FileCode } from "lucide-react"

export default function AddressDetailPage({ address }) {
  const [addressData, setAddressData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isLoadingAddress, setIsLoadingAddress] = useState(true)
  const [isLoadingTxs, setIsLoadingTxs] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [parsedABI, setParsedABI] = useState(null)
  const { rpcUrl, getContractABI } = useBlockchain()
  const { navigate } = useRouter()

  useEffect(() => {
    const savedABI = getContractABI(address)
    if (savedABI) {
      setParsedABI(savedABI)
    }
  }, [address, getContractABI])

  useEffect(() => {
    const loadAddress = async () => {
      if (!rpcUrl || !address) return
      try {
        const data = await fetchAddressByAddress(rpcUrl, address)
        setAddressData(data)
      } catch (error) {
        console.error("Error fetching address:", error)
      } finally {
        setIsLoadingAddress(false)
      }
    }
    loadAddress()
  }, [rpcUrl, address])

  useEffect(() => {
    const loadTransactions = async () => {
      if (!rpcUrl || !address) return
      try {
        const data = await fetchAddressTransactions(rpcUrl, address)
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoadingTxs(false)
      }
    }
    loadTransactions()
  }, [rpcUrl, address])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const OverviewContent = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title text-lg">Address Information</h3>
        </div>
        <div className="card-content space-y-4">
          {isLoadingAddress ? (
            <>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Address</div>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </>
          ) : addressData ? (
            <>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm break-all">{addressData.address}</code>
                  <button
                    onClick={() => copyToClipboard(addressData.address)}
                    className="btn btn-ghost btn-sm shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedAddress && <p className="text-xs text-[oklch(0.65_0.25_151)]">Copied to clipboard!</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Balance</div>
                  <div className="text-2xl font-semibold text-foreground">{addressData.balance}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Type</div>
                  <div className="text-2xl font-semibold text-foreground">
                    {addressData.isContract ? "Contract" : "Wallet"}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Transactions</div>
                  <div className="text-2xl font-semibold text-foreground">{addressData.transactionCount}</div>
                </div>
              </div>

              {addressData.isContract && addressData.code && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Contract Code (Bytecode)</div>
                  <div className="p-3 bg-muted rounded-lg max-h-40 overflow-auto">
                    <code className="text-xs break-all">{addressData.code}</code>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-destructive">Error loading address data</p>
            </div>
          )}
        </div>
      </div>

      {addressData?.isContract && (
        <ContractInteraction
          contractAddress={address}
          onABIParsed={(abi) => setParsedABI(abi.length > 0 ? abi : null)}
        />
      )}
    </div>
  )

  const TransactionsContent = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title text-lg">Transaction History</h3>
      </div>
      <div className="card-content">
        {isLoadingTxs ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
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
                        <code className="text-xs text-muted-foreground truncate">{tx.hash}</code>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">From: </span>
                          <code className="text-xs">{tx.from.slice(0, 10)}...</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">To: </span>
                          <code className="text-xs">{tx.to.slice(0, 10)}...</code>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-semibold">{tx.amount}</div>
                      <div className="text-xs text-muted-foreground">{tx.timeAgo}</div>
                    </div>
                  </div>
                </div>

                {parsedABI && tx.input && tx.input !== "0x" && (
                  <DecodedTransactionInput inputData={tx.input} abi={parsedABI} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewContent /> },
    { id: "transactions", label: "Transactions", content: <TransactionsContent /> },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Address Details</h1>
            {addressData && (
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-semibold ${addressData.isContract ? "bg-muted text-foreground border border-border" : "bg-secondary text-secondary-foreground"}`}
              >
                {addressData.isContract ? (
                  <>
                    <FileCode className="w-5 h-5" />
                    Contract
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Wallet
                  </>
                )}
              </span>
            )}
          </div>

          <Tabs tabs={tabs} defaultTab="overview" />
        </div>
      </main>

      <Footer />
    </div>
  )
}
