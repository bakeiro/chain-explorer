"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { StatsCards } from "@/components/stats-cards"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NetworkStatus } from "@/components/network-status"
import { useBlockchain } from "@/contexts/blockchain-context"
import { RpcConnector } from "@/components/rpc-connector"

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { isConnected } = useBlockchain()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Determine if it's a transaction hash, block number, or address
    if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
      // Transaction hash
      router.push(`/transaction/${searchQuery}`)
    } else if (/^\d+$/.test(searchQuery)) {
      // Block number
      router.push(`/block/${searchQuery}`)
    } else if (searchQuery.startsWith("0x") && searchQuery.length === 42) {
      // Address
      router.push(`/address/${searchQuery}`)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <RpcConnector />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Search Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Blockchain Explorer</h1>
            <p className="text-lg text-muted-foreground text-balance">
              Search and explore transactions, blocks, and addresses in real-time
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by transaction hash, block number, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-base bg-card border-border"
              />
            </div>
          </form>
        </div>

        {/* Stats Grid */}
        <StatsCards />

        <NetworkStatus />
      </main>

      <Footer />
    </div>
  )
}
