import { useState, useCallback } from "react"

/**
 * Safely parse JSON, returning the raw value if parsing fails
 */
function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    // If it's a plain string (not JSON), return it as-is
    return value ?? fallback
  }
}

/**
 * Custom hook for persisted state in localStorage
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[*, Function, Function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return initialValue
      return safeJsonParse(item, initialValue)
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        // Store strings directly, objects as JSON
        const serialized = typeof valueToStore === "string" ? valueToStore : JSON.stringify(valueToStore)
        localStorage.setItem(key, serialized)
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook for managing address-keyed data (ABIs, labels)
 * Normalizes addresses to lowercase
 */
export function useAddressStorage(key) {
  const [data, setData, removeAll] = useLocalStorage(key, {})

  const normalizeAddress = (address) => address?.toLowerCase() ?? ""

  const get = useCallback((address) => data[normalizeAddress(address)] ?? null, [data])

  const set = useCallback(
    (address, value) => {
      setData((prev) => ({
        ...prev,
        [normalizeAddress(address)]: value,
      }))
    },
    [setData],
  )

  const remove = useCallback(
    (address) => {
      setData((prev) => {
        const updated = { ...prev }
        delete updated[normalizeAddress(address)]
        return updated
      })
    },
    [setData],
  )

  return { get, set, remove, removeAll }
}
