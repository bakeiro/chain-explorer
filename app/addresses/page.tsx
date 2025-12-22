"use client"

import type React from "react"

import { useBlockchain } from "@/contexts/blockchain-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Wallet, FileCode } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddressesPage() {
  const { isConnected } = useBlockchain()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/address/${searchQuery.trim()}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Address Explorer</h1>
            <p className="text-muted-foreground text-lg">
              Search for wallet addresses or smart contracts on the blockchain
            </p>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Search Address</CardTitle>
              <CardDescription>Enter a wallet address or contract address to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-9 cursor-text"
                  />
                </div>
                <Button onClick={handleSearch} className="cursor-pointer">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/10 hover:border-primary/30 transition-colors cursor-default">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Wallet Addresses</CardTitle>
                    <CardDescription className="text-sm">View balance and transaction history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Check ETH balance</li>
                  <li>• View transaction history</li>
                  <li>• See sent and received transactions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/10 hover:border-primary/30 transition-colors cursor-default">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Smart Contracts</CardTitle>
                    <CardDescription className="text-sm">Explore contract details and code</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• View contract code</li>
                  <li>• Check contract balance</li>
                  <li>• See contract interactions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
