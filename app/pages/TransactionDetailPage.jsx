 

import { useState, useEffect } from "react"
import { useBlockchain, useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import Skeleton from "../components/Skeleton"
import DecodedTransactionInput from "../components/DecodedTransactionInput"
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

            <div className="card p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{transaction.hash}</code>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => copyToClipboard(transaction.hash, "hash")}
                    >
                      <Copy
                        className={`h-3 w-3 ${copiedField === "hash" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {transaction.status}
                  </span>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Block Number</span>
                  <button
                    onClick={() => navigate("block-detail", { blockNumber: transaction.blockNumber })}
                    className="text-sm text-primary hover:underline cursor-pointer"
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
                      className="text-sm font-mono text-primary hover:underline cursor-pointer"
                    >
                      {transaction.from}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => copyToClipboard(transaction.from, "from")}
                    >
                      <Copy
                        className={`h-3 w-3 ${copiedField === "from" ? "text-primary" : "text-muted-foreground"}`}
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
                          className="text-sm font-mono text-primary hover:underline cursor-pointer"
                        >
                          {transaction.to}
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => copyToClipboard(transaction.to, "to")}
                        >
                          <Copy
                            className={`h-3 w-3 ${copiedField === "to" ? "text-primary" : "text-muted-foreground"}`}
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

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Gas Price</span>
                  <span className="text-sm">{transaction.gasPrice}</span>
                </div>

                {transaction.input && transaction.input !== "0x" && (
                  <div className="flex flex-col gap-2 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Input Data</span>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => copyToClipboard(transaction.input, "input")}
                        >
                          <Copy
                            className={`h-3 w-3 ${copiedField === "input" ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </button>
                        {contractABI ? (
                          <button onClick={handleRemoveABI} className="btn btn-outline btn-sm text-destructive">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove ABI
                          </button>
                        ) : (
                          <button onClick={() => setShowABIInput(!showABIInput)} className="btn btn-outline btn-sm">
                            <FileCode className="w-3 h-3 mr-1" />
                            Add ABI to Decode
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-md p-4 border border-border">
                      <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">
                        {transaction.input}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showABIInput && !contractABI && transaction.input && transaction.input !== "0x" && (
              <div className="card p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Add Contract ABI</h3>
                    <p className="text-sm text-muted-foreground">
                      Paste the contract ABI to decode the transaction input data
                    </p>
                  </div>
                  <textarea
                    placeholder='[{"type":"function","name":"transfer","inputs":[...]}]'
                    value={abiInput}
                    onChange={(e) => setAbiInput(e.target.value)}
                    className="textarea min-h-[200px] font-mono text-sm"
                  />
                  {abiError && <p className="text-sm text-destructive">{abiError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleParseABI} className="btn btn-primary btn-md">
                      Parse and Save ABI
                    </button>
                    <button onClick={() => setShowABIInput(false)} className="btn btn-outline btn-md">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {contractABI && transaction.input && transaction.input !== "0x" && (
              <DecodedTransactionInput inputData={transaction.input} abi={contractABI} />
            )}
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
