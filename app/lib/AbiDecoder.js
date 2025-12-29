import { ethers } from "ethers"

/**
 * Parse and validate ABI JSON string
 */
export function parseABI(abiString) {
  try {
    const parsedABI = JSON.parse(abiString)

    if (!Array.isArray(parsedABI)) {
      throw new Error("ABI must be an array")
    }

    const validTypes = ["function", "constructor", "event"]
    return parsedABI.filter((item) => validTypes.includes(item.type))
  } catch (error) {
    throw new Error("Invalid ABI format. Please paste a valid JSON ABI.")
  }
}

/**
 * Extract 4-byte function selector from input data
 */
export function extractFunctionSelector(inputData) {
  if (!inputData || inputData === "0x" || inputData.length < 10) {
    return ""
  }
  return inputData.slice(0, 10)
}

/**
 * Get function signature string from ABI item
 */
export function getFunctionSignature(abiFunction) {
  const params = abiFunction.inputs.map((input) => input.type).join(",")
  return `${abiFunction.name}(${params})`
}

/**
 * Calculate function selector hash using ethers
 */
function calculateSelector(signature) {
  return ethers.id(signature).slice(0, 10)
}

/**
 * Find matching function in ABI by selector
 */
export function findMatchingFunction(abi, selector) {
  if (!abi || !Array.isArray(abi)) return null

  for (const func of abi) {
    if (func.type !== "function") continue

    const signature = getFunctionSignature(func)
    const funcSelector = calculateSelector(signature)

    if (funcSelector.toLowerCase() === selector.toLowerCase()) {
      return func
    }
  }

  return null
}

/**
 * Decode input data parameters using ABI function definition
 */
export function decodeInputData(inputData, abiFunction) {
  if (!inputData || inputData === "0x" || inputData.length <= 10) {
    return []
  }

  const params = inputData.slice(10)
  const decoded = []
  const PARAM_SIZE = 64 // 32 bytes in hex

  let offset = 0
  for (const input of abiFunction.inputs) {
    const paramHex = params.slice(offset, offset + PARAM_SIZE)

    const value = decodeParam(paramHex, input.type)

    decoded.push({
      name: input.name || `param${offset / PARAM_SIZE}`,
      type: input.type,
      value,
    })

    offset += PARAM_SIZE
  }

  return decoded
}

/**
 * Decode a single parameter based on its type
 */
function decodeParam(paramHex, type) {
  if (type === "address") {
    return "0x" + paramHex.slice(24)
  }

  if (type.startsWith("uint") || type.startsWith("int")) {
    return BigInt("0x" + paramHex).toString()
  }

  if (type === "bool") {
    return Number.parseInt(paramHex, 16) === 1 ? "true" : "false"
  }

  // Default: return as hex
  return "0x" + paramHex
}

/**
 * Format ABI functions for display
 */
export function formatABIForDisplay(abi) {
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
