"use client"

import { useParams } from "next/navigation"
import { useBlockchain } from "@/contexts/blockchain-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Wallet, FileCode } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { fetchAddressByAddress, fetchAddressTransactions } from "@/lib/blockchain-api"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ContractInteraction } from "@/components/contract-interaction"
import { DecodedTransactionInput } from "@/components/decoded-transaction-input"
import type { ABIFunction } from "@/lib/abi-decoder"

export default function AddressDetailPage() {
  const params = useParams()
  const address = params.address as string
  const { isConnected, rpcUrl, getContractABI } = useBlockchain()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [parsedABI, setParsedABI] = useState<ABIFunction[] | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedABI = getContractABI(address)
    if (savedABI) {
      setParsedABI(savedABI)
    }
  }, [address, getContractABI])

  const {
    data: addressData,
    isLoading: isLoadingAddress,
    error: addressError,
  } = useQuery({
    queryKey: ["address", address, rpcUrl],
    queryFn: () => fetchAddressByAddress(rpcUrl, address),
    enabled: isConnected && !!address,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const {
    data: transactions,
    isLoading: isLoadingTxs,
    error: txsError,
  } = useQuery({
    queryKey: ["addressTransactions", address, rpcUrl],
    queryFn: () => fetchAddressTransactions(rpcUrl, address),
    enabled: isConnected && !!address,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Address Details</h1>
            {addressData && (
              <Badge variant={addressData.isContract ? "default" : "secondary"} className="cursor-default">
                {addressData.isContract ? (
                  <>
                    <FileCode className="w-3 h-3 mr-1" />
                    Contract
                  </>
                ) : (
                  <>
                    <Wallet className="w-3 h-3 mr-1" />
                    Wallet
                  </>
                )}
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              ) : addressError ? (
                <div className="text-center py-8">
                  <p className="text-destructive">Error loading address data</p>
                  <p className="text-sm text-muted-foreground mt-2">Please check the address and try again</p>
                </div>
              ) : addressData ? (
                <>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 text-sm break-all">{addressData.address}</code>
                      <Button
                        onClick={() => copyToClipboard(addressData.address)}
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {copiedAddress && <p className="text-xs text-primary">Copied to clipboard!</p>}
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
              ) : null}
            </CardContent>
          </Card>

          {addressData?.isContract && (
            <ContractInteraction
              contractAddress={address}
              onABIParsed={(abi) => setParsedABI(abi.length > 0 ? abi : null)}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTxs ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : txsError ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Error loading transactions</p>
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
                        onClick={() => router.push(`/transaction/${tx.hash}`)}
                        className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={tx.type === "send" ? "destructive" : "default"}
                                className="cursor-default"
                              >
                                {tx.type === "send" ? "OUT" : "IN"}
                              </Badge>
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
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
