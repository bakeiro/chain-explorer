import { RPC_CONFIG, RPC_METHODS } from "./constants"

interface RPCRequest {
  jsonrpc: string
  method: string
  params: unknown[]
  id: number
}

interface RPCResponse<T = unknown> {
  jsonrpc: string
  id: number
  result?: T
  error?: {
    code: number
    message: string
  }
}

interface RPCError extends Error {
  code?: number
}

class RPCClient {
  private url: string
  private requestId: number

  constructor(url: string = RPC_CONFIG.DEFAULT_URL) {
    this.url = url
    this.requestId = 1
  }

  private createRequest(method: string, params: unknown[] = []): RPCRequest {
    return {
      jsonrpc: RPC_CONFIG.JSON_RPC_VERSION,
      method,
      params,
      id: this.requestId++,
    }
  }

  private async validateResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw this.createError(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes(RPC_CONFIG.CONTENT_TYPE)) {
      throw this.createError(`Invalid RPC endpoint. Expected JSON but received ${contentType}`)
    }
  }

  private createError(message: string, code?: number): RPCError {
    const error = new Error(message) as RPCError
    if (code !== undefined) {
      error.code = code
    }
    return error
  }

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    try {
      const request = this.createRequest(method, params)

      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": RPC_CONFIG.CONTENT_TYPE,
        },
        body: JSON.stringify(request),
      })

      await this.validateResponse(response)

      const data: RPCResponse<T> = await response.json()

      if (data.error) {
        throw this.createError(data.error.message, data.error.code)
      }

      return data.result as T
    } catch (error) {
      console.error(`RPC Error (${method}):`, error)
      throw error
    }
  }

  async getBlockNumber(): Promise<string> {
    return this.call<string>(RPC_METHODS.GET_BLOCK_NUMBER)
  }

  async getBlock(blockNumber: number | string, includeTransactions = true): Promise<unknown> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : blockNumber
    return this.call(RPC_METHODS.GET_BLOCK_BY_NUMBER, [blockParam, includeTransactions])
  }

  async getTransaction(txHash: string): Promise<unknown> {
    return this.call(RPC_METHODS.GET_TRANSACTION_BY_HASH, [txHash])
  }

  async getBalance(address: string): Promise<string> {
    return this.call<string>(RPC_METHODS.GET_BALANCE, [address, "latest"])
  }

  async getGasPrice(): Promise<string> {
    return this.call<string>(RPC_METHODS.GET_GAS_PRICE)
  }

  async getChainId(): Promise<string> {
    return this.call<string>(RPC_METHODS.GET_CHAIN_ID)
  }

  async getCode(address: string): Promise<string> {
    return this.call<string>(RPC_METHODS.GET_CODE, [address, "latest"])
  }

  async getTransactionReceipt(txHash: string): Promise<unknown> {
    return this.call(RPC_METHODS.GET_TRANSACTION_RECEIPT, [txHash])
  }

  async getTransactionCount(address: string): Promise<string> {
    return this.call<string>(RPC_METHODS.GET_TRANSACTION_COUNT, [address, "latest"])
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.call(RPC_METHODS.GET_NET_VERSION)
      return true
    } catch {
      return false
    }
  }
}

export default RPCClient
