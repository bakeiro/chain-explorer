"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useBlockchain } from "@/contexts/blockchain-context"
import { RpcConnector } from "@/components/rpc-connector"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, FileCode, Trash2 } from "lucide-react"
import { fetchTransactionById } from "@/lib/blockchain-api"
import { useState, useEffect } from "react"
import { parseABI, type ABIFunction } from "@/lib/abi-decoder"
import { DecodedTransactionInput } from "@/components/decoded-transaction-input"
import Link from "next/link"

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const hash = params.hash as string
  const { isConnected, rpcUrl, getContractABI, saveContractABI, removeContractABI } = useBlockchain()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showABIInput, setShowABIInput] = useState(false)
  const [abiInput, setAbiInput] = useState("")
  const [abiError, setAbiError] = useState("")
  const [contractABI, setContractABI] = useState<ABIFunction[] | null>(null)

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", hash, rpcUrl],
    queryFn: () => fetchTransactionById(rpcUrl!, hash),
    enabled: isConnected && !!rpcUrl,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
  })

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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 500)
  }

  if (!isConnected) {
    return <RpcConnector />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

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
        ) : transaction ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
              <p className="text-muted-foreground">View detailed information about this transaction</p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{transaction.hash}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      onClick={() => copyToClipboard(transaction.hash, "hash")}
                    >
                      <Copy
                        className={`h-3 w-3 ${copiedField === "hash" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Button>
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
                  <Link href={`/block/${transaction.blockNumber}`} className="text-sm text-primary hover:underline">
                    {transaction.blockNumber}
                  </Link>
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
                    <Link
                      href={`/address/${transaction.from}`}
                      className="text-sm font-mono text-primary hover:underline"
                    >
                      {transaction.from}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-pointer"
                      onClick={() => copyToClipboard(transaction.from, "from")}
                    >
                      <Copy
                        className={`h-3 w-3 ${copiedField === "from" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">To</span>
                  <div className="flex items-center gap-2">
                    {transaction.to === "Contract Creation" ? (
                      <span className="text-sm text-muted-foreground">Contract Creation</span>
                    ) : (
                      <>
                        <Link
                          href={`/address/${transaction.to}`}
                          className="text-sm font-mono text-primary hover:underline"
                        >
                          {transaction.to}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer"
                          onClick={() => copyToClipboard(transaction.to, "to")}
                        >
                          <Copy
                            className={`h-3 w-3 ${copiedField === "to" ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer"
                          onClick={() => copyToClipboard(transaction.input!, "input")}
                        >
                          <Copy
                            className={`h-3 w-3 ${copiedField === "input" ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </Button>
                        {contractABI ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveABI}
                            className="cursor-pointer text-destructive hover:text-destructive bg-transparent"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove ABI
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowABIInput(!showABIInput)}
                            className="cursor-pointer"
                          >
                            <FileCode className="w-3 h-3 mr-1" />
                            Add ABI to Decode
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-md p-4 border border-border">
                      <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">
                        {transaction.input}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This transaction interacts with a smart contract. The input data contains the function signature
                      and arguments encoded in hexadecimal.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {showABIInput && !contractABI && transaction.input && transaction.input !== "0x" && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Add Contract ABI</h3>
                    <p className="text-sm text-muted-foreground">
                      Paste the contract ABI to decode the transaction input data
                    </p>
                  </div>
                  <Textarea
                    placeholder='[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],...}]'
                    value={abiInput}
                    onChange={(e) => setAbiInput(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  {abiError && <p className="text-sm text-destructive">{abiError}</p>}
                  <div className="flex gap-2">
                    <Button onClick={handleParseABI} className="cursor-pointer">
                      Parse and Save ABI
                    </Button>
                    <Button onClick={() => setShowABIInput(false)} variant="outline" className="cursor-pointer">
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {contractABI && transaction.input && transaction.input !== "0x" && (
              <DecodedTransactionInput inputData={transaction.input} abi={contractABI} />
            )}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">Transaction not found</p>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
