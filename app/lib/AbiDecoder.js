import { ethers } from "ethers";

export function parseABI(abiString) {
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

export function extractFunctionSelector(inputData) {
  if (!inputData || inputData === "0x" || inputData.length < 10) {
    return ""
  }

  return inputData.slice(0, 10)
}

export function getFunctionSignature(abiFunction) {
  const params = abiFunction.inputs.map((input) => input.type).join(",")
  return `${abiFunction.name}(${params})`
}

export function findMatchingFunction(abi, selector) {
  for (const func of abi) {
    if (func.type !== "function") continue

    const signature = getFunctionSignature(func)
    const funcSelector = getFunctionSelector(signature).slice(0, 10)

    if (funcSelector.toLowerCase() === selector.toLowerCase()) {
      return func
    }
  }

  return null
}

function getFunctionSelector(signature) {
  return ethers.id(signature).slice(0, 10);
}

export function decodeInputData(inputData, abiFunction) {
  if (!inputData || inputData === "0x" || inputData.length <= 10) {
    return []
  }

  const params = inputData.slice(10)
  const decoded = []

  let offset = 0
  for (const input of abiFunction.inputs) {
    const paramHex = params.slice(offset, offset + 64)

    let value
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
