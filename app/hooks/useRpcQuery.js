import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query"
import { useBlockchain } from "../contexts/BlockchainContext"
import RPCClient from "../lib/RpcClient"

// Singleton QueryClient with default cache settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Cache time configurations for different data types
export const CACHE_CONFIG = {
  // Data that changes frequently
  REALTIME: { staleTime: 5 * 1000 }, // 5 seconds
  // Standard blockchain data
  STANDARD: { staleTime: 30 * 1000 }, // 30 seconds
  // Historical data that rarely changes
  HISTORICAL: { staleTime: 5 * 60 * 1000 }, // 5 minutes
  // Immutable data (confirmed transactions, old blocks)
  IMMUTABLE: { staleTime: Number.POSITIVE_INFINITY }, // Never stale
}

// Generate cache key for RPC calls
export function getRpcQueryKey(rpcUrl, method, params = []) {
  return ["rpc", rpcUrl, method, JSON.stringify(params)]
}

// Core RPC fetch function (used by React Query)
async function fetchRpc(rpcUrl, method, params = []) {
  const client = new RPCClient(rpcUrl)
  return client.call(method, params)
}

// Hook for making cached RPC calls
export function useRpcQuery(method, params = [], options = {}) {
  const { rpcUrl } = useBlockchain()

  return useQuery({
    queryKey: getRpcQueryKey(rpcUrl, method, params),
    queryFn: () => fetchRpc(rpcUrl, method, params),
    enabled: Boolean(rpcUrl) && options.enabled !== false,
    ...options,
  })
}

// Hook for prefetching RPC data
export function usePrefetchRpc() {
  const queryClient = useQueryClient()
  const { rpcUrl } = useBlockchain()

  return async (method, params = [], options = {}) => {
    if (!rpcUrl) return

    await queryClient.prefetchQuery({
      queryKey: getRpcQueryKey(rpcUrl, method, params),
      queryFn: () => fetchRpc(rpcUrl, method, params),
      ...options,
    })
  }
}

// Hook for invalidating cached RPC data
export function useInvalidateRpc() {
  const queryClient = useQueryClient()
  const { rpcUrl } = useBlockchain()

  return (method, params) => {
    if (method && params) {
      queryClient.invalidateQueries({ queryKey: getRpcQueryKey(rpcUrl, method, params) })
    } else if (method) {
      queryClient.invalidateQueries({ queryKey: ["rpc", rpcUrl, method] })
    } else {
      queryClient.invalidateQueries({ queryKey: ["rpc", rpcUrl] })
    }
  }
}

// Cached RPC Client class that uses React Query's cache
export class CachedRPCClient {
  constructor(rpcUrl, queryClient) {
    this.rpcUrl = rpcUrl
    this.queryClient = queryClient
    this.client = new RPCClient(rpcUrl)
  }

  async call(method, params = [], cacheConfig = CACHE_CONFIG.STANDARD) {
    const queryKey = getRpcQueryKey(this.rpcUrl, method, params)

    // Check if data is in cache and not stale
    const cachedData = this.queryClient.getQueryData(queryKey)
    const queryState = this.queryClient.getQueryState(queryKey)

    if (cachedData !== undefined && queryState) {
      const isStale = Date.now() - queryState.dataUpdatedAt > (cacheConfig.staleTime || 30000)
      if (!isStale) {
        return cachedData
      }
    }

    // Fetch and cache the data
    const data = await this.queryClient.fetchQuery({
      queryKey,
      queryFn: () => this.client.call(method, params),
      staleTime: cacheConfig.staleTime,
    })

    return data
  }

  // Convenience methods with appropriate cache times
  async getBlockNumber() {
    return this.call("eth_blockNumber", [], CACHE_CONFIG.REALTIME)
  }

  async getBlock(blockNumber, includeTransactions = true) {
    const blockParam = typeof blockNumber === "number" ? "0x" + blockNumber.toString(16) : blockNumber
    // Historical blocks are immutable
    const isHistorical = blockParam !== "latest" && blockParam !== "pending"
    return this.call(
      "eth_getBlockByNumber",
      [blockParam, includeTransactions],
      isHistorical ? CACHE_CONFIG.IMMUTABLE : CACHE_CONFIG.REALTIME,
    )
  }

  async getTransaction(txHash) {
    return this.call("eth_getTransactionByHash", [txHash], CACHE_CONFIG.IMMUTABLE)
  }

  async getTransactionReceipt(txHash) {
    return this.call("eth_getTransactionReceipt", [txHash], CACHE_CONFIG.IMMUTABLE)
  }

  async getTransactionCount(address) {
    return this.call("eth_getTransactionCount", [address, "latest"], CACHE_CONFIG.STANDARD)
  }

  async getBalance(address) {
    return this.call("eth_getBalance", [address, "latest"], CACHE_CONFIG.STANDARD)
  }

  async getCode(address) {
    return this.call("eth_getCode", [address, "latest"], CACHE_CONFIG.HISTORICAL)
  }

  async getGasPrice() {
    return this.call("eth_gasPrice", [], CACHE_CONFIG.REALTIME)
  }

  async getChainId() {
    return this.call("eth_chainId", [], CACHE_CONFIG.IMMUTABLE)
  }

  async getLogs(filter) {
    return this.call("eth_getLogs", [filter], CACHE_CONFIG.STANDARD)
  }

  async traceTransaction(txHash) {
    const tracerConfig = { tracer: "callTracer", tracerConfig: { onlyTopCall: false } }
    try {
      return await this.call("debug_traceTransaction", [txHash, tracerConfig], CACHE_CONFIG.IMMUTABLE)
    } catch {
      try {
        return await this.call("debug_traceTransaction", [txHash], CACHE_CONFIG.IMMUTABLE)
      } catch {
        return null
      }
    }
  }

  async ethCall(to, data) {
    return this.call("eth_call", [{ to, data }, "latest"], CACHE_CONFIG.STANDARD)
  }
}

// Factory function to create cached client
export function createCachedRPCClient(rpcUrl) {
  return new CachedRPCClient(rpcUrl, queryClient)
}
