"use client"

import { useState } from "react"
import { useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import { Search, Wallet, FileCode } from "lucide-react"

export default function AddressesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { navigate } = useRouter()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate("address-detail", { address: searchQuery.trim() })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Address Explorer</h1>
            <p className="text-muted-foreground text-lg">
              Search for wallet addresses or smart contracts on the blockchain
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-lg pl-14 pr-4 w-full"
              />
            </div>
          </form>

          <div className="space-y-4">            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card border-primary/10 hover:border-primary/30 transition-colors">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Wallet Addresses</h3>
                      <p className="card-description text-sm">View balance and transaction history</p>
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Check ETH balance</li>
                    <li>• View transaction history</li>
                    <li>• See sent and received transactions</li>
                  </ul>
                </div>
              </div>

              <div className="card border-primary/10 hover:border-primary/30 transition-colors">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileCode className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Smart Contracts</h3>
                      <p className="card-description text-sm">Explore contract details and code</p>
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• View contract code</li>
                    <li>• Check contract balance</li>
                    <li>• See contract interactions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
