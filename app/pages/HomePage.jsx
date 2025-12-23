 

import { useState } from "react"
import { useRouter } from "../App"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import StatsCards from "../components/StatsCards"
import NetworkStatus from "../components/NetworkStatus"
import { Search } from "lucide-react"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { navigate } = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    if (searchQuery.startsWith("0x") && searchQuery.length === 66) {
      navigate("transaction-detail", { hash: searchQuery })
    } else if (/^\d+$/.test(searchQuery)) {
      navigate("block-detail", { blockNumber: Number.parseInt(searchQuery) })
    } else if (searchQuery.startsWith("0x") && searchQuery.length === 42) {
      navigate("address-detail", { address: searchQuery })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
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
              <input
                type="text"
                placeholder="Search by transaction hash, block number, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-lg pl-14 pr-4 w-full border-[oklch(0.65_0.25_151)]/30 focus:border-[oklch(0.65_0.25_151)] shadow-sm shadow-[oklch(0.65_0.25_151)]/10"
              />
            </div>
          </form>
        </div>

        <StatsCards />
        <NetworkStatus />
      </main>

      <Footer />
    </div>
  )
}
