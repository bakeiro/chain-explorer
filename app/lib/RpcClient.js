import { RPC_CONFIG, RPC_METHODS } from "./Constants"
import { decimalToHex } from "./Formatters"

class RPCClient {
  constructor(url = RPC_CONFIG.DEFAULT_URL) {
    this.url = url
    this.requestId = 1
  }

  // Private methods
  #createRequest(method, params = []) {
    return {
      jsonrpc: RPC_CONFIG.JSON_RPC_VERSION,
      method,
      params,
      id: this.requestId++,
    }
  }

  #createError(message, code) {
    const error = new Error(message)
    if (code !== undefined) error.code = code
    return error
  }

  async #validateResponse(response) {
    if (!response.ok) {
      throw this.#createError(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes(RPC_CONFIG.CONTENT_TYPE)) {
      throw this.#createError(`Invalid RPC endpoint. Expected JSON but received ${contentType}`)
    }
  }

  // Core RPC call
  async call(method, params = []) {
    try {
      const request = this.#createRequest(method, params)

      const response = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": RPC_CONFIG.CONTENT_TYPE },
        body: JSON.stringify(request),
      })

      await this.#validateResponse(response)
      const data = await response.json()

      if (data.error) {
        throw this.#createError(data.error.message, data.error.code)
      }

      return data.result
    } catch (error) {
      console.error(`RPC Error (${method}):`, error)
      throw error
    }
  }

  // Block methods
  async getBlockNumber() {
    return this.call(RPC_METHODS.GET_BLOCK_NUMBER)
  }

  async getBlock(blockNumber, includeTransactions = true) {
    const blockParam = typeof blockNumber === "number" ? decimalToHex(blockNumber) : blockNumber
    return this.call(RPC_METHODS.GET_BLOCK_BY_NUMBER, [blockParam, includeTransactions])
  }

  // Transaction methods
  async getTransaction(txHash) {
    return this.call(RPC_METHODS.GET_TRANSACTION_BY_HASH, [txHash])
  }

  async getTransactionReceipt(txHash) {
    return this.call(RPC_METHODS.GET_TRANSACTION_RECEIPT, [txHash])
  }

  async getTransactionCount(address) {
    return this.call(RPC_METHODS.GET_TRANSACTION_COUNT, [address, "latest"])
  }

  // Account methods
  async getBalance(address) {
    return this.call(RPC_METHODS.GET_BALANCE, [address, "latest"])
  }

  async getCode(address) {
    return this.call(RPC_METHODS.GET_CODE, [address, "latest"])
  }

  // Network methods
  async getGasPrice() {
    return this.call(RPC_METHODS.GET_GAS_PRICE)
  }

  async getChainId() {
    return this.call(RPC_METHODS.GET_CHAIN_ID)
  }

  async isConnected() {
    try {
      await this.call(RPC_METHODS.GET_NET_VERSION)
      return true
    } catch {
      return false
    }
  }

  // Log methods
  async getLogs(filter) {
    return this.call(RPC_METHODS.GET_LOGS, [filter])
  }

  // Debug methods
  async traceTransaction(txHash) {
    const tracerConfig = { tracer: "callTracer", tracerConfig: { onlyTopCall: false } }

    try {
      return await this.call(RPC_METHODS.DEBUG_TRACE_TRANSACTION, [txHash, tracerConfig])
    } catch {
      // Fallback to basic tracer if callTracer is not available
      try {
        return await this.call(RPC_METHODS.DEBUG_TRACE_TRANSACTION, [txHash])
      } catch (fallbackError) {
        console.debug("Tracing not supported:", fallbackError.message)
        return null
      }
    }
  }
}

export default RPCClient
