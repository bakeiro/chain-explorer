"use client"

import { useState, createContext, useContext, useEffect } from "react"
import "../main.css"

// Pages
import HomePage from "./pages/HomePage"
import TransactionsPage from "./pages/TransactionsPage"
import BlocksPage from "./pages/BlocksPage"
import AddressesPage from "./pages/AddressesPage"
import BlockDetailPage from "./pages/BlockDetailPage"
import TransactionDetailPage from "./pages/TransactionDetailPage"
import AddressDetailPage from "./pages/AddressDetailPage"

// Components
import RpcConnector from "./components/RpcConnector"

// Context
const BlockchainContext = createContext(null)
const RouterContext = createContext(null)

// Storage keys
const STORAGE_KEYS = {
  RPC_URL: "blockchain_rpc_url",
  CONTRACT_ABIS: "blockchain_contract_abis",
}

// Router Hook
export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error("useRouter must be used within RouterProvider")
  }
  return context
}

// Blockchain Hook
export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (!context) {
    throw new Error("useBlockchain must be used within BlockchainProvider")
  }
  return context
}

function App() {
  // Router state
  const [currentPage, setCurrentPage] = useState("home")
  const [pageParams, setPageParams] = useState({})

  // Blockchain state
  const [rpcUrl, setRpcUrlState] = useState(null)
  const [contractABIs, setContractABIs] = useState({})

  // Load saved data on mount
  useEffect(() => {
    const savedRpcUrl = localStorage.getItem(STORAGE_KEYS.RPC_URL)
    if (savedRpcUrl) {
      setRpcUrlState(savedRpcUrl)
    }

    const savedABIs = localStorage.getItem(STORAGE_KEYS.CONTRACT_ABIS)
    if (savedABIs) {
      try {
        setContractABIs(JSON.parse(savedABIs))
      } catch (error) {
        console.error("Failed to parse saved ABIs:", error)
      }
    }
  }, [])

  // Router functions
  const navigate = (page, params = {}) => {
    setCurrentPage(page)
    setPageParams(params)
  }

  const goBack = () => {
    // Simple back navigation based on page hierarchy
    if (currentPage.includes("detail")) {
      const basePage = currentPage.replace("-detail", "s")
      navigate(basePage)
    } else {
      navigate("home")
    }
  }

  // Blockchain functions
  const setRpcUrl = (url) => {
    setRpcUrlState(url)
    if (url) {
      localStorage.setItem(STORAGE_KEYS.RPC_URL, url)
    } else {
      localStorage.removeItem(STORAGE_KEYS.RPC_URL)
    }
  }

  const disconnect = () => {
    setRpcUrlState(null)
    localStorage.removeItem(STORAGE_KEYS.RPC_URL)
    navigate("home")
  }

  const getContractABI = (address) => {
    const normalizedAddress = address.toLowerCase()
    return contractABIs[normalizedAddress] || null
  }

  const saveContractABI = (address, abi) => {
    const normalizedAddress = address.toLowerCase()
    const updatedABIs = { ...contractABIs, [normalizedAddress]: abi }
    setContractABIs(updatedABIs)
    localStorage.setItem(STORAGE_KEYS.CONTRACT_ABIS, JSON.stringify(updatedABIs))
  }

  const removeContractABI = (address) => {
    const normalizedAddress = address.toLowerCase()
    const updatedABIs = { ...contractABIs }
    delete updatedABIs[normalizedAddress]
    setContractABIs(updatedABIs)
    localStorage.setItem(STORAGE_KEYS.CONTRACT_ABIS, JSON.stringify(updatedABIs))
  }

  const routerValue = {
    currentPage,
    pageParams,
    navigate,
    goBack,
  }

  const blockchainValue = {
    rpcUrl,
    setRpcUrl,
    isConnected: !!rpcUrl,
    disconnect,
    getContractABI,
    saveContractABI,
    removeContractABI,
  }

  // Show RPC connector if not connected
  if (!rpcUrl) {
    return (
      <BlockchainContext.Provider value={blockchainValue}>
        <div className="dark min-h-screen bg-background">
          <RpcConnector />
        </div>
      </BlockchainContext.Provider>
    )
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />
      case "transactions":
        return <TransactionsPage />
      case "blocks":
        return <BlocksPage />
      case "addresses":
        return <AddressesPage />
      case "block-detail":
        return <BlockDetailPage blockNumber={pageParams.blockNumber} />
      case "transaction-detail":
        return <TransactionDetailPage hash={pageParams.hash} />
      case "address-detail":
        return <AddressDetailPage address={pageParams.address} />
      default:
        return <HomePage />
    }
  }

  return (
    <BlockchainContext.Provider value={blockchainValue}>
      <RouterContext.Provider value={routerValue}>
        <div className="dark min-h-screen bg-background text-foreground">{renderPage()}</div>
      </RouterContext.Provider>
    </BlockchainContext.Provider>
  )
}

export default App
