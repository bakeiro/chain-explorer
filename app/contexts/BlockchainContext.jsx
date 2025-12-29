import { createContext, useContext, useMemo, useCallback } from "react"
import { useLocalStorage, useAddressStorage } from "../hooks/useLocalStorage"
import { STORAGE_KEYS } from "../lib/Constants"

const BlockchainContext = createContext(null)

export function BlockchainProvider({ children }) {
  const [rpcUrl, setRpcUrlInternal, removeRpcUrl] = useLocalStorage(STORAGE_KEYS.RPC_URL, null)
  const contractABIs = useAddressStorage(STORAGE_KEYS.CONTRACT_ABIS)
  const addressLabels = useAddressStorage(STORAGE_KEYS.ADDRESS_LABELS)
  const [savedAddresses, setSavedAddresses] = useLocalStorage(STORAGE_KEYS.SAVED_ADDRESSES, [])

  const setRpcUrl = useCallback(
    (url) => {
      if (url) {
        setRpcUrlInternal(url)
      } else {
        removeRpcUrl()
      }
    },
    [setRpcUrlInternal, removeRpcUrl],
  )

  const disconnect = useCallback(() => {
    removeRpcUrl()
  }, [removeRpcUrl])

  const isAddressSaved = useCallback(
    (address) => savedAddresses.some((a) => a.toLowerCase() === address?.toLowerCase()),
    [savedAddresses],
  )

  const saveAddress = useCallback(
    (address) => {
      if (!address || isAddressSaved(address)) return
      setSavedAddresses((prev) => [...prev, address.toLowerCase()])
    },
    [setSavedAddresses, isAddressSaved],
  )

  const unsaveAddress = useCallback(
    (address) => {
      setSavedAddresses((prev) => prev.filter((a) => a.toLowerCase() !== address?.toLowerCase()))
    },
    [setSavedAddresses],
  )

  const value = useMemo(
    () => ({
      // Connection
      rpcUrl,
      setRpcUrl,
      isConnected: Boolean(rpcUrl),
      disconnect,
      // Contract ABIs
      getContractABI: contractABIs.get,
      saveContractABI: contractABIs.set,
      removeContractABI: contractABIs.remove,
      // Address Labels
      getAddressLabel: addressLabels.get,
      saveAddressLabel: addressLabels.set,
      removeAddressLabel: addressLabels.remove,
      savedAddresses,
      isAddressSaved,
      saveAddress,
      unsaveAddress,
    }),
    [
      rpcUrl,
      setRpcUrl,
      disconnect,
      contractABIs,
      addressLabels,
      savedAddresses,
      isAddressSaved,
      saveAddress,
      unsaveAddress,
    ],
  )

  return <BlockchainContext.Provider value={value}>{children}</BlockchainContext.Provider>
}

export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (!context) {
    throw new Error("useBlockchain must be used within BlockchainProvider")
  }
  return context
}
