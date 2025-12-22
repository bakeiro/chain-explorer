import RPCClient from "./rpc-client"
import type { Transaction, Block, Stats, Address } from "./mock-data"
import {
  hexToDecimal,
  weiToEth,
  weiToGwei,
  formatEthValue,
  formatGweiValue,
  formatGasValue,
  formatBlockSize,
  getTimeAgo,
  formatTimestamp,
  isValidTransactionInput,
} from "./formatters"
import { BLOCKCHAIN_CONFIG } from "./constants"

interface RawTransaction {
  hash: string
  from?: string
  to?: string | null
  value?: string
  gas?: string
  gasPrice?: string
  blockNumber?: string
  input?: string
}

interface RawBlock {
  number: string
  hash: string
  timestamp: string
  transactions: unknown[]
  miner?: string
  gasUsed?: string
  gasLimit?: string
  size?: string
}

function createRPCClient(rpcUrl: string): RPCClient {
  return new RPCClient(rpcUrl)
}

function parseTransaction(tx: RawTransaction, blockTimestamp: number): Transaction {
  const value = weiToEth(tx.value || "0x0")
  const gasPrice = weiToGwei(tx.gasPrice || "0x0")

  return {
    hash: tx.hash,
    from: tx.from || "0x0",
    to: tx.to || "Contract Creation",
    amount: formatEthValue(value),
    value,
    type: "send",
    timestamp: formatTimestamp(blockTimestamp),
    timeAgo: getTimeAgo(blockTimestamp),
    status: "success",
    blockNumber: hexToDecimal(tx.blockNumber || "0x0"),
    gasUsed: formatGasValue(hexToDecimal(tx.gas || "0x0")),
    gasPrice: formatGweiValue(gasPrice),
    input: isValidTransactionInput(tx.input) ? tx.input : undefined,
  }
}

function parseBlock(rawBlock: RawBlock): Block {
  const timestamp = hexToDecimal(rawBlock.timestamp)
  const gasUsed = hexToDecimal(rawBlock.gasUsed || "0x0")
  const gasLimit = hexToDecimal(rawBlock.gasLimit || "0x0")
  const size = hexToDecimal(rawBlock.size || "0x0")
  const transactionCount = Array.isArray(rawBlock.transactions) ? rawBlock.transactions.length : 0

  return {
    number: hexToDecimal(rawBlock.number),
    hash: rawBlock.hash,
    timestamp: formatTimestamp(timestamp),
    timeAgo: getTimeAgo(timestamp),
    transactions: transactionCount,
    miner: rawBlock.miner || "0x0",
    gasUsed: formatGasValue(gasUsed),
    gasLimit: formatGasValue(gasLimit),
    size: formatBlockSize(size),
    reward: BLOCKCHAIN_CONFIG.DEFAULT_BLOCK_REWARD,
  }
}

async function getLatestBlockNumber(client: RPCClient): Promise<number> {
  const latestBlockHex = await client.getBlockNumber()
  return hexToDecimal(latestBlockHex)
}

async function collectTransactionsFromBlocks(
  client: RPCClient,
  startBlock: number,
  maxBlocks: number,
  maxTransactions: number,
): Promise<Transaction[]> {
  const transactions: Transaction[] = []

  for (let i = 0; i < maxBlocks && transactions.length < maxTransactions; i++) {
    const blockNumber = startBlock - i
    const block = await client.getBlock(blockNumber, true)

    if (!block || !Array.isArray((block as RawBlock).transactions)) {
      continue
    }

    const rawBlock = block as RawBlock
    const blockTimestamp = hexToDecimal(rawBlock.timestamp)
    const blockTxs = rawBlock.transactions.slice(0, BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_BLOCK)

    for (const tx of blockTxs) {
      if (typeof tx === "object" && (tx as RawTransaction).hash) {
        transactions.push(parseTransaction(tx as RawTransaction, blockTimestamp))

        if (transactions.length >= maxTransactions) {
          break
        }
      }
    }
  }

  return transactions
}

export async function fetchTransactions(rpcUrl: string): Promise<Transaction[]> {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const blocksToFetch = Math.min(BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_FETCH, latestBlockNumber)

    return await collectTransactionsFromBlocks(
      client,
      latestBlockNumber,
      blocksToFetch,
      BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST,
    )
  } catch (error) {
    console.error("Error fetching transactions:", error)
    throw error
  }
}

export async function fetchBlocks(rpcUrl: string): Promise<Block[]> {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const blocksToFetch = Math.min(BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_FETCH, latestBlockNumber)
    const blocks: Block[] = []

    for (let i = 0; i < blocksToFetch; i++) {
      const blockNumber = latestBlockNumber - i
      const block = await client.getBlock(blockNumber, false)

      if (block) {
        blocks.push(parseBlock(block as RawBlock))
      }
    }

    return blocks
  } catch (error) {
    console.error("Error fetching blocks:", error)
    throw error
  }
}

async function calculateAverageBlockTime(client: RPCClient, latestBlockNumber: number): Promise<string> {
  const block1 = (await client.getBlock(latestBlockNumber, false)) as RawBlock
  const block2 = (await client.getBlock(latestBlockNumber - 1, false)) as RawBlock

  if (!block1 || !block2) {
    return "12s"
  }

  const time1 = hexToDecimal(block1.timestamp)
  const time2 = hexToDecimal(block2.timestamp)
  const timeDifference = time1 - time2

  return `${timeDifference}s`
}

async function estimateTotalTransactions(client: RPCClient, latestBlockNumber: number): Promise<number> {
  let totalTransactions = 0

  for (let i = 0; i < BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_FETCH; i++) {
    const block = (await client.getBlock(latestBlockNumber - i, false)) as RawBlock

    if (block?.transactions) {
      totalTransactions += Array.isArray(block.transactions) ? block.transactions.length : 0
    }
  }

  return totalTransactions * 100
}

async function calculateTPS(client: RPCClient, blockCount = 10): Promise<string> {
  try {
    const currentBlockNum = await getLatestBlockNumber(client)
    let totalTxs = 0
    let oldestTimestamp: number | null = null
    let newestTimestamp: number | null = null

    for (let i = 0; i < blockCount; i++) {
      const block = (await client.getBlock(currentBlockNum - i, false)) as RawBlock
      if (!block) continue

      totalTxs += Array.isArray(block.transactions) ? block.transactions.length : 0
      const timestamp = hexToDecimal(block.timestamp)

      if (oldestTimestamp === null) oldestTimestamp = timestamp
      newestTimestamp = timestamp
    }

    if (oldestTimestamp === null || newestTimestamp === null) return "0"

    const timeSpan = oldestTimestamp - newestTimestamp
    return timeSpan > 0 ? (totalTxs / timeSpan).toFixed(2) : "0"
  } catch (error) {
    console.error("Error calculating TPS:", error)
    return "0"
  }
}

async function getChainId(client: RPCClient): Promise<number> {
  try {
    const chainIdHex = await client.getChainId()
    return hexToDecimal(chainIdHex)
  } catch (error) {
    console.error("Error getting chain ID:", error)
    return 0
  }
}

export async function fetchStats(rpcUrl: string): Promise<Stats> {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const gasPriceHex = await client.getGasPrice()
    const gasPrice = weiToGwei(gasPriceHex)
    const latestBlock = (await client.getBlock("latest", true)) as RawBlock
    const chainId = await getChainId(client)
    const tps = await calculateTPS(client, 10)

    const [avgBlockTime, totalTransactions] = await Promise.all([
      calculateAverageBlockTime(client, latestBlockNumber),
      estimateTotalTransactions(client, latestBlockNumber),
    ])

    return {
      totalBlocks: latestBlockNumber,
      totalTransactions,
      volume24h: "$0.00",
      activeWallets: 0,
      avgBlockTime,
      avgGasPrice: formatGweiValue(gasPrice),
      tps,
      chainId,
      latestBlockTransactions: Array.isArray(latestBlock.transactions) ? latestBlock.transactions.length : 0,
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    throw error
  }
}

export async function fetchTransactionById(rpcUrl: string, hash: string): Promise<Transaction | null> {
  const client = createRPCClient(rpcUrl)

  try {
    const tx = (await client.getTransaction(hash)) as RawTransaction

    if (!tx) {
      return null
    }

    const block = (await client.getBlock(hexToDecimal(tx.blockNumber || "0x0"), false)) as RawBlock
    const blockTimestamp = block ? hexToDecimal(block.timestamp) : Date.now() / 1000

    return parseTransaction(tx, blockTimestamp)
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return null
  }
}

export async function fetchBlockById(rpcUrl: string, number: number): Promise<Block | null> {
  const client = createRPCClient(rpcUrl)

  try {
    const block = (await client.getBlock(number, false)) as RawBlock

    if (!block) {
      return null
    }

    return parseBlock(block)
  } catch (error) {
    console.error("Error fetching block:", error)
    return null
  }
}

export async function fetchAddressByAddress(rpcUrl: string, address: string): Promise<Address | null> {
  const client = createRPCClient(rpcUrl)

  try {
    const balanceHex = await client.getBalance(address)
    const balanceEth = weiToEth(balanceHex)

    const code = await client.getCode(address)
    const isContract = code !== "0x" && code.length > 2

    const txCountHex = await client.getTransactionCount(address)
    const transactionCount = hexToDecimal(txCountHex)

    return {
      address,
      balance: formatEthValue(balanceEth),
      balanceEth,
      isContract,
      transactionCount,
      code: isContract ? code : undefined,
    }
  } catch (error) {
    console.error("Error fetching address:", error)
    return null
  }
}

function addressMatchesTransaction(tx: RawTransaction, targetAddress: string): boolean {
  const normalizedTarget = targetAddress.toLowerCase()
  return tx.from?.toLowerCase() === normalizedTarget || tx.to?.toLowerCase() === normalizedTarget
}

function determineTransactionType(tx: RawTransaction, targetAddress: string): "send" | "receive" {
  return tx.from?.toLowerCase() === targetAddress.toLowerCase() ? "send" : "receive"
}

export async function fetchAddressTransactions(rpcUrl: string, address: string): Promise<Transaction[]> {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const blocksToSearch = Math.min(BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_SEARCH_FOR_ADDRESS, latestBlockNumber)
    const transactions: Transaction[] = []

    for (let i = 0; i < blocksToSearch && transactions.length < BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST; i++) {
      const blockNumber = latestBlockNumber - i
      const block = (await client.getBlock(blockNumber, true)) as RawBlock

      if (!block?.transactions || !Array.isArray(block.transactions)) {
        continue
      }

      const blockTimestamp = hexToDecimal(block.timestamp)

      for (const tx of block.transactions) {
        const rawTx = tx as RawTransaction

        if (typeof tx === "object" && rawTx.hash && addressMatchesTransaction(rawTx, address)) {
          const transaction = parseTransaction(rawTx, blockTimestamp)
          transaction.type = determineTransactionType(rawTx, address)
          transactions.push(transaction)

          if (transactions.length >= BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST) {
            break
          }
        }
      }
    }

    return transactions
  } catch (error) {
    console.error("Error fetching address transactions:", error)
    throw error
  }
}
