import { BLOCKCHAIN_CONFIG, TIME_UNITS } from "./constants"

export function hexToDecimal(hex: string): number {
  return Number.parseInt(hex, 16)
}

export function weiToEth(wei: string): number {
  return hexToDecimal(wei) / BLOCKCHAIN_CONFIG.WEI_TO_ETH_DIVISOR
}

export function weiToGwei(wei: string): number {
  return hexToDecimal(wei) / BLOCKCHAIN_CONFIG.WEI_TO_GWEI_DIVISOR
}

export function formatEthValue(value: number): string {
  return `${value.toFixed(4)} ETH`
}

export function formatGweiValue(value: number): string {
  return `${value.toFixed(2)} Gwei`
}

export function formatGasValue(gas: number): string {
  return gas.toLocaleString()
}

export function formatBlockSize(sizeInBytes: number): string {
  const sizeInKB = sizeInBytes / 1024
  return `${sizeInKB.toFixed(2)} KB`
}

export function getTimeAgo(timestamp: number): string {
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

export function formatTimestamp(timestamp: number): string {
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

export function numberToHex(value: number): string {
  return `0x${value.toString(16)}`
}

export function isValidTransactionInput(input: string | undefined): boolean {
  return !!input && input !== "0x" && input.length > 2
}
