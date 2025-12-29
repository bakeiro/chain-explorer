import { BLOCKCHAIN_CONFIG, TIME_UNITS } from "./Constants"

// Hex conversions
export function hexToDecimal(hex) {
  if (!hex) return 0
  return Number.parseInt(hex, 16)
}

export function decimalToHex(value) {
  return `0x${value.toString(16)}`
}

// Wei conversions
export function weiToEth(wei) {
  return hexToDecimal(wei) / BLOCKCHAIN_CONFIG.WEI_TO_ETH_DIVISOR
}

export function weiToGwei(wei) {
  return hexToDecimal(wei) / BLOCKCHAIN_CONFIG.WEI_TO_GWEI_DIVISOR
}

// Value formatters
export function formatEthValue(value) {
  return `${value.toFixed(4)} ETH`
}

export function formatGweiValue(value) {
  return `${value.toFixed(2)} Gwei`
}

export function formatGasValue(gas) {
  return gas.toLocaleString()
}

export function formatBlockSize(sizeInBytes) {
  const sizeInKB = sizeInBytes / 1024
  return `${sizeInKB.toFixed(2)} KB`
}

/**
 * Format token value with decimals (default 18)
 */
export function formatTokenValue(value, decimals = BLOCKCHAIN_CONFIG.DEFAULT_TOKEN_DECIMALS) {
  const divisor = BigInt(10 ** decimals)
  const bigValue = BigInt(value)
  const integerPart = bigValue / divisor
  const decimalPart = bigValue % divisor

  if (decimalPart === BigInt(0)) {
    return integerPart.toString()
  }

  const decimalStr = decimalPart.toString().padStart(decimals, "0").slice(0, 4)
  return `${integerPart}.${decimalStr}`
}

// Time formatters
export function getTimeAgo(timestamp) {
  const now = Date.now()
  const diffInSeconds = Math.floor((now - timestamp * 1000) / 1000)

  if (diffInSeconds < TIME_UNITS.MINUTE) {
    return `${diffInSeconds} secs ago`
  }

  if (diffInSeconds < TIME_UNITS.HOUR) {
    return `${Math.floor(diffInSeconds / TIME_UNITS.MINUTE)} mins ago`
  }

  if (diffInSeconds < TIME_UNITS.DAY) {
    return `${Math.floor(diffInSeconds / TIME_UNITS.HOUR)} hours ago`
  }

  return `${Math.floor(diffInSeconds / TIME_UNITS.DAY)} days ago`
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Validation helpers
export function isValidTransactionInput(input) {
  return Boolean(input && input !== "0x" && input.length > 2)
}

export function isContractCode(code) {
  return code !== "0x" && code.length > 2
}

// Address helpers
export function normalizeAddress(address) {
  return address?.toLowerCase() ?? ""
}

export function padAddressToBytes32(address) {
  return "0x" + address.slice(2).toLowerCase().padStart(64, "0")
}

export function addressesMatch(addr1, addr2) {
  return normalizeAddress(addr1) === normalizeAddress(addr2)
}

export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address) return ""
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

export function truncateHash(hash, startChars = 10, endChars = 4) {
  if (!hash) return ""
  if (hash.length <= startChars + endChars) return hash
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
}
