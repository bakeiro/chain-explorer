import { useState, useEffect } from "react"
import { useBlockchain, useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Skeleton from "../components/Skeleton"
import Tabs from "../components/Tabs"
import DecodedTransactionInput from "../components/DecodedTransactionInput"
import TransactionLogs from "../components/TransactionsLogs"
import { fetchTransactionById } from "../lib/BlockchainApi"
import { parseABI } from "../lib/AbiDecoder"
import { ArrowLeft, Copy, FileCode, Trash2 } from "lucide-react"

export default function TransactionDetailPage({ hash }) {
  const [transaction, setTransaction] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedField, setCopiedField] = useState(null)
  const [showABIInput, setShowABIInput] = useState(false)
  const [abiInput, setAbiInput] = useState("")
  const [abiError, setAbiError] = useState("")
  const [contractABI, setContractABI] = useState(null)
  const { rpcUrl, getContractABI, saveContractABI, removeContractABI } = useBlockchain()
  const { goBack, navigate } = useRouter()

  useEffect(() => {
    const loadTransaction = async () => {
      if (!rpcUrl || !hash) return
      try {
        const data = await fetchTransactionById(rpcUrl, hash)
        setTransaction(data)
      } catch (error) {
        console.error("Error fetching transaction:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTransaction()
  }, [rpcUrl, hash])

  useEffect(() => {
    if (transaction?.to && transaction.to !== "Contract Creation") {
      const savedABI = getContractABI(transaction.to)
      if (savedABI) {
        setContractABI(savedABI)
      }
    }
  }, [transaction, getContractABI])

  const handleParseABI = () => {
    if (!transaction?.to || transaction.to === "Contract Creation") return
    try {
      setAbiError("")
      const abi = parseABI(abiInput)
      setContractABI(abi)
      saveContractABI(transaction.to, abi)
      setShowABIInput(false)
      setAbiInput("")
    } catch (err) {
      setAbiError(err instanceof Error ? err.message : "Failed to parse ABI")
    }
  }

  const handleRemoveABI = () => {
    if (transaction?.to && transaction.to !== "Contract Creation") {
      removeContractABI(transaction.to)
      setContractABI(null)
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 500)
  }

  const OverviewContent = () => (
    <div className="card p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">Transaction Hash</span>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{transaction.hash}</code>
            <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(transaction.hash, "hash")}>
              <Copy
                className={`h-3 w-3 ${copiedField === "hash" ? "text-[oklch(0.65_0.25_151)]" : "text-muted-foreground"}`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <span className="text-sm px-2 py-1 rounded-full bg-[oklch(0.65_0.25_151)]/10 text-[oklch(0.65_0.25_151)]">
            {transaction.status}
          </span>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">Block Number</span>
          <button
            onClick={() => navigate("block-detail", { blockNumber: transaction.blockNumber })}
            className="text-sm text-[oklch(0.65_0.25_151)] hover:underline cursor-pointer"
          >
            {transaction.blockNumber}
          </button>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">Timestamp</span>
          <div className="text-right">
            <div className="text-sm">{transaction.timestamp}</div>
            <div className="text-xs text-muted-foreground">{transaction.timeAgo}</div>
          </div>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">From</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("address-detail", { address: transaction.from })}
              className="text-sm font-mono text-[oklch(0.65_0.25_151)] hover:underline cursor-pointer"
            >
              {transaction.from}
            </button>
            <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(transaction.from, "from")}>
              <Copy
                className={`h-3 w-3 ${copiedField === "from" ? "text-[oklch(0.65_0.25_151)]" : "text-muted-foreground"}`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">To</span>
          <div className="flex items-center gap-2">
            {transaction.to === "Contract Creation" ? (
              <span className="text-sm text-muted-foreground">Contract Creation</span>
            ) : (
              <>
                <button
                  onClick={() => navigate("address-detail", { address: transaction.to })}
                  className="text-sm font-mono text-[oklch(0.65_0.25_151)] hover:underline cursor-pointer"
                >
                  {transaction.to}
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(transaction.to, "to")}>
                  <Copy
                    className={`h-3 w-3 ${copiedField === "to" ? "text-[oklch(0.65_0.25_151)]" : "text-muted-foreground"}`}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">Value</span>
          <div className="text-right">
            <div className="text-sm font-semibold">{transaction.amount}</div>
            <div className="text-xs text-muted-foreground">{transaction.value} ETH</div>
          </div>
        </div>

        <div className="flex justify-between items-start py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">Gas Used</span>
          <span className="text-sm">{transaction.gasUsed}</span>
        </div>

        <div className="flex justify-between items-start py-3">
          <span className="text-sm font-medium text-muted-foreground">Gas Price</span>
          <span className="text-sm">{transaction.gasPrice}</span>
        </div>
      </div>
    </div>
  )

  const InputDataContent = () => (
    <div className="space-y-6">
      {/* Raw Input Data */}
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Raw Input Data</h3>
            {transaction.input && transaction.input !== "0x" && (
              <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(transaction.input, "input")}>
                <Copy
                  className={`h-3 w-3 mr-2 ${copiedField === "input" ? "text-[oklch(0.65_0.25_151)]" : "text-muted-foreground"}`}
                />
                Copy
              </button>
            )}
          </div>
          {transaction.input && transaction.input !== "0x" ? (
            <div className="bg-muted/50 rounded-md p-4 border border-border">
              <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">
                {transaction.input}
              </code>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No input data for this transaction</p>
          )}
        </div>

        <br />

        {/* Decoded Input */}
        {contractABI && transaction.input && transaction.input !== "0x" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Decoded Input Data</h3>
            <DecodedTransactionInput inputData={transaction.input} abi={contractABI} />
          </div>
        )}
      </div>


      {/* ABI Management */}
      {transaction.input && transaction.input !== "0x" && (
        <div className="card p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Contract ABI</h3>
                <p className="text-sm text-muted-foreground">Add an ABI to decode the input data</p>
              </div>

            {contractABI && (
              <button onClick={handleRemoveABI} className="btn btn-outline btn-sm text-destructive">
                <Trash2 className="w-3 h-3 mr-2" />
                Remove ABI
              </button>
              )}
            </div>

            {!contractABI && (
              <div className="space-y-4 pt-4 border-t border-border">
                <textarea
                  placeholder='[{"type":"function","name":"transfer","inputs":[...]}]'
                  value={abiInput}
                  onChange={(e) => setAbiInput(e.target.value)}
                  className="textarea min-h-[200px] font-mono text-sm"
                />
                {abiError && <p className="text-sm text-destructive">{abiError}</p>}
                <button onClick={handleParseABI} className="btn btn-primary btn-md">
                  Parse and Save ABI
                </button>
              </div>
            )}

            {contractABI && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-[oklch(0.65_0.25_151)]">ABI loaded successfully</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const EventsContent = () => (
    <TransactionLogs
      logs={transaction.logs}
      abi={contractABI}
      getContractABI={getContractABI}
      transactionTo={transaction.to}
      onNavigate={navigate}
    />
  )

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewContent /> },
    { id: "input-data", label: "Input Data", content: <InputDataContent /> },
    { id: "events", label: `Events (${transaction?.logs?.length || 0})`, content: <EventsContent /> },
  ]

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
        ) : transaction ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
              <p className="text-muted-foreground">View detailed information about this transaction</p>
            </div>

            <Tabs tabs={tabs} defaultTab="overview" />
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-lg text-muted-foreground">Transaction not found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
