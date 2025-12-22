"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { STORAGE_KEYS } from "@/lib/constants"
import type { ABIFunction } from "@/lib/abi-decoder"

interface BlockchainContextType {
  rpcUrl: string | null
  setRpcUrl: (url: string) => void
  isConnected: boolean
  disconnect: () => void
  getContractABI: (address: string) => ABIFunction[] | null
  saveContractABI: (address: string, abi: ABIFunction[]) => void
  removeContractABI: (address: string) => void
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined)

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [rpcUrl, setRpcUrlState] = useState<string | null>(null)
  const [contractABIs, setContractABIs] = useState<Record<string, ABIFunction[]>>({})

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

  const setRpcUrl = (url: string) => {
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
  }

  const getContractABI = (address: string): ABIFunction[] | null => {
    const normalizedAddress = address.toLowerCase()
    return contractABIs[normalizedAddress] || null
  }

  const saveContractABI = (address: string, abi: ABIFunction[]) => {
    const normalizedAddress = address.toLowerCase()
    const updatedABIs = { ...contractABIs, [normalizedAddress]: abi }
    setContractABIs(updatedABIs)
    localStorage.setItem(STORAGE_KEYS.CONTRACT_ABIS, JSON.stringify(updatedABIs))
  }

  const removeContractABI = (address: string) => {
    const normalizedAddress = address.toLowerCase()
    const updatedABIs = { ...contractABIs }
    delete updatedABIs[normalizedAddress]
    setContractABIs(updatedABIs)
    localStorage.setItem(STORAGE_KEYS.CONTRACT_ABIS, JSON.stringify(updatedABIs))
  }

  return (
    <BlockchainContext.Provider
      value={{
        rpcUrl,
        setRpcUrl,
        isConnected: !!rpcUrl,
        disconnect,
        getContractABI,
        saveContractABI,
        removeContractABI,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
}

export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider")
  }
  return context
}
