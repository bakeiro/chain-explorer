// ABI decoder utilities for smart contracts

export interface ABIFunction {
  name: string
  type: string
  inputs: ABIInput[]
  outputs?: ABIInput[]
  stateMutability?: string
}

export interface ABIInput {
  name: string
  type: string
  indexed?: boolean
}

export interface DecodedInput {
  name: string
  type: string
  value: string
}

export function parseABI(abiString: string): ABIFunction[] {
  try {
    const parsedABI = JSON.parse(abiString)

    if (!Array.isArray(parsedABI)) {
      throw new Error("ABI must be an array")
    }

    return parsedABI.filter((item) => item.type === "function" || item.type === "constructor" || item.type === "event")
  } catch (error) {
    throw new Error("Invalid ABI format. Please paste a valid JSON ABI.")
  }
}

export function extractFunctionSelector(inputData: string): string {
  if (!inputData || inputData === "0x" || inputData.length < 10) {
    return ""
  }

  return inputData.slice(0, 10)
}

export function calculateFunctionSelector(functionSignature: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(functionSignature)

  return crypto.subtle.digest("SHA-256", data).then((hash) => {
    const hashArray = Array.from(new Uint8Array(hash))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return "0x" + hashHex.slice(0, 8)
  })
}

export function getFunctionSignature(abiFunction: ABIFunction): string {
  const params = abiFunction.inputs.map((input) => input.type).join(",")
  return `${abiFunction.name}(${params})`
}

export function findMatchingFunction(abi: ABIFunction[], selector: string): ABIFunction | null {
  for (const func of abi) {
    if (func.type !== "function") continue

    const signature = getFunctionSignature(func)
    const funcSelector = keccak256(signature).slice(0, 10)

    if (funcSelector.toLowerCase() === selector.toLowerCase()) {
      return func
    }
  }

  return null
}

function keccak256(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const hex = (hash >>> 0).toString(16).padStart(8, "0")
  return "0x" + hex.padEnd(64, "0")
}

export function decodeInputData(inputData: string, abiFunction: ABIFunction): DecodedInput[] {
  if (!inputData || inputData === "0x" || inputData.length <= 10) {
    return []
  }

  const params = inputData.slice(10)
  const decoded: DecodedInput[] = []

  let offset = 0
  for (const input of abiFunction.inputs) {
    const paramHex = params.slice(offset, offset + 64)

    let value: string
    if (input.type === "address") {
      value = "0x" + paramHex.slice(24)
    } else if (input.type.startsWith("uint") || input.type.startsWith("int")) {
      value = Number.parseInt(paramHex, 16).toString()
    } else if (input.type === "bool") {
      value = Number.parseInt(paramHex, 16) === 1 ? "true" : "false"
    } else if (input.type === "string" || input.type === "bytes") {
      value = "0x" + paramHex
    } else {
      value = "0x" + paramHex
    }

    decoded.push({
      name: input.name || `param${offset / 64}`,
      type: input.type,
      value,
    })

    offset += 64
  }

  return decoded
}

export function formatABIForDisplay(abi: ABIFunction[]): string {
  return abi
    .filter((item) => item.type === "function")
    .map((func) => {
      const params = func.inputs.map((input) => `${input.type} ${input.name}`).join(", ")
      const returns = func.outputs?.map((output) => output.type).join(", ") || "void"
      const mutability = func.stateMutability || "nonpayable"

      return `${func.name}(${params}) ${mutability} returns (${returns})`
    })
    .join("\n")
}
