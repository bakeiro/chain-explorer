import RPCClient from "./RpcClient"
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
} from "./Formatters"
import { BLOCKCHAIN_CONFIG } from "./Constants"

function createRPCClient(rpcUrl) {
  return new RPCClient(rpcUrl)
}

function parseTransaction(tx, blockTimestamp) {
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

function parseBlock(rawBlock) {
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

async function getLatestBlockNumber(client) {
  const latestBlockHex = await client.getBlockNumber()
  return hexToDecimal(latestBlockHex)
}

async function collectTransactionsFromBlocks(client, startBlock, maxBlocks, maxTransactions) {
  const transactions = []

  for (let i = 0; i < maxBlocks && transactions.length < maxTransactions; i++) {
    const blockNumber = startBlock - i
    const block = await client.getBlock(blockNumber, true)

    if (!block || !Array.isArray(block.transactions)) {
      continue
    }

    const blockTimestamp = hexToDecimal(block.timestamp)
    const blockTxs = block.transactions.slice(0, BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_BLOCK)

    for (const tx of blockTxs) {
      if (typeof tx === "object" && tx.hash) {
        transactions.push(parseTransaction(tx, blockTimestamp))

        if (transactions.length >= maxTransactions) {
          break
        }
      }
    }
  }

  return transactions
}

export async function fetchTransactions(rpcUrl) {
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

export async function fetchBlocks(rpcUrl) {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const blocksToFetch = Math.min(BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_FETCH, latestBlockNumber)
    const blocks = []

    for (let i = 0; i < blocksToFetch; i++) {
      const blockNumber = latestBlockNumber - i
      const block = await client.getBlock(blockNumber, false)

      if (block) {
        blocks.push(parseBlock(block))
      }
    }

    return blocks
  } catch (error) {
    console.error("Error fetching blocks:", error)
    throw error
  }
}

async function calculateAverageBlockTime(client, latestBlockNumber) {
  const block1 = await client.getBlock(latestBlockNumber, false)
  const block2 = await client.getBlock(latestBlockNumber - 1, false)

  if (!block1 || !block2) {
    return "12s"
  }

  const time1 = hexToDecimal(block1.timestamp)
  const time2 = hexToDecimal(block2.timestamp)
  const timeDifference = time1 - time2

  return `${timeDifference}s`
}

async function estimateTotalTransactions(client, latestBlockNumber) {
  let totalTransactions = 0

  for (let i = 0; i < BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_FETCH; i++) {
    const block = await client.getBlock(latestBlockNumber - i, false)

    if (block?.transactions) {
      totalTransactions += Array.isArray(block.transactions) ? block.transactions.length : 0
    }
  }

  return totalTransactions * 100
}

async function calculateTPS(client, blockCount = 10) {
  try {
    const currentBlockNum = await getLatestBlockNumber(client)
    let totalTxs = 0
    let oldestTimestamp = null
    let newestTimestamp = null

    for (let i = 0; i < blockCount; i++) {
      const block = await client.getBlock(currentBlockNum - i, false)
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

async function getChainId(client) {
  try {
    const chainIdHex = await client.getChainId()
    return hexToDecimal(chainIdHex)
  } catch (error) {
    console.error("Error getting chain ID:", error)
    return 0
  }
}

export async function fetchStats(rpcUrl) {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const gasPriceHex = await client.getGasPrice()
    const gasPrice = weiToGwei(gasPriceHex)
    const latestBlock = await client.getBlock("latest", true)
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

export async function fetchTransactionById(rpcUrl, hash) {
  const client = createRPCClient(rpcUrl)

  try {
    const tx = await client.getTransaction(hash)

    if (!tx) {
      return null
    }

    const block = await client.getBlock(hexToDecimal(tx.blockNumber || "0x0"), false)
    const blockTimestamp = block ? hexToDecimal(block.timestamp) : Date.now() / 1000

    const receipt = await client.getTransactionReceipt(hash)

    const transaction = parseTransaction(tx, blockTimestamp)

    // Añadir logs al objeto transaction
    if (receipt && receipt.logs) {
      transaction.logs = receipt.logs
      transaction.logsCount = receipt.logs.length
    }

    return transaction
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return null
  }
}

export async function fetchBlockById(rpcUrl, number) {
  const client = createRPCClient(rpcUrl)

  try {
    const block = await client.getBlock(number, false)

    if (!block) {
      return null
    }

    return parseBlock(block)
  } catch (error) {
    console.error("Error fetching block:", error)
    return null
  }
}

export async function fetchAddressByAddress(rpcUrl, address) {
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

function addressMatchesTransaction(tx, targetAddress) {
  const normalizedTarget = targetAddress.toLowerCase()
  return tx.from?.toLowerCase() === normalizedTarget || tx.to?.toLowerCase() === normalizedTarget
}

function determineTransactionType(tx, targetAddress) {
  return tx.from?.toLowerCase() === targetAddress.toLowerCase() ? "send" : "receive"
}

export async function fetchAddressTransactions(rpcUrl, address) {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const blocksToSearch = Math.min(BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_SEARCH_FOR_ADDRESS, latestBlockNumber)
    const transactions = []

    for (let i = 0; i < blocksToSearch && transactions.length < BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST; i++) {
      const blockNumber = latestBlockNumber - i
      const block = await client.getBlock(blockNumber, true)

      if (!block?.transactions || !Array.isArray(block.transactions)) {
        continue
      }

      const blockTimestamp = hexToDecimal(block.timestamp)

      for (const tx of block.transactions) {
        if (typeof tx === "object" && tx.hash && addressMatchesTransaction(tx, address)) {
          const transaction = parseTransaction(tx, blockTimestamp)
          transaction.type = determineTransactionType(tx, address)
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
