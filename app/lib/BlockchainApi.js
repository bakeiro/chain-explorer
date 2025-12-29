import RPCClient from "./RpcClient"
import {
  hexToDecimal,
  decimalToHex,
  weiToEth,
  weiToGwei,
  formatEthValue,
  formatGweiValue,
  formatGasValue,
  formatBlockSize,
  formatTokenValue,
  getTimeAgo,
  formatTimestamp,
  isValidTransactionInput,
  isContractCode,
  normalizeAddress,
  addressesMatch,
  padAddressToBytes32,
} from "./Formatters"
import { BLOCKCHAIN_CONFIG, ERC20_TOPICS, INTERNAL_TX_TYPES, TX_DIRECTION } from "./Constants"

// Factory
function createRPCClient(rpcUrl) {
  return new RPCClient(rpcUrl)
}

// Parsers
function parseTransaction(tx, blockTimestamp) {
  const value = weiToEth(tx.value || "0x0")
  const gasPrice = weiToGwei(tx.gasPrice || "0x0")

  return {
    hash: tx.hash,
    from: tx.from || "0x0",
    to: tx.to || "Contract Creation",
    amount: formatEthValue(value),
    value,
    type: TX_DIRECTION.SEND,
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

// Helpers
async function getLatestBlockNumber(client) {
  const latestBlockHex = await client.getBlockNumber()
  return hexToDecimal(latestBlockHex)
}

async function getBlockTimestamp(client, blockNumber) {
  const block = await client.getBlock(blockNumber, false)
  return block ? hexToDecimal(block.timestamp) : Date.now() / 1000
}

function determineTransactionDirection(tx, targetAddress) {
  return addressesMatch(tx.from, targetAddress) ? TX_DIRECTION.SEND : TX_DIRECTION.RECEIVE
}

// Collectors
async function collectTransactionsFromBlocks(client, startBlock, maxBlocks, maxTransactions) {
  const transactions = []

  for (let i = 0; i < maxBlocks && transactions.length < maxTransactions; i++) {
    const blockNumber = startBlock - i
    const block = await client.getBlock(blockNumber, true)

    if (!block?.transactions || !Array.isArray(block.transactions)) continue

    const blockTimestamp = hexToDecimal(block.timestamp)
    const blockTxs = block.transactions.slice(0, BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_BLOCK)

    for (const tx of blockTxs) {
      if (typeof tx === "object" && tx.hash) {
        transactions.push(parseTransaction(tx, blockTimestamp))
        if (transactions.length >= maxTransactions) break
      }
    }
  }

  return transactions
}

// Public API
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
      if (block) blocks.push(parseBlock(block))
    }

    return blocks
  } catch (error) {
    console.error("Error fetching blocks:", error)
    throw error
  }
}

async function calculateAverageBlockTime(client, latestBlockNumber) {
  const [block1, block2] = await Promise.all([
    client.getBlock(latestBlockNumber, false),
    client.getBlock(latestBlockNumber - 1, false),
  ])

  if (!block1 || !block2) return "12s"

  const timeDifference = hexToDecimal(block1.timestamp) - hexToDecimal(block2.timestamp)
  return `${timeDifference}s`
}

async function calculateTPS(client, blockCount = BLOCKCHAIN_CONFIG.TPS_BLOCK_SAMPLE_SIZE) {
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

export async function fetchStats(rpcUrl) {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const gasPriceHex = await client.getGasPrice()
    const gasPrice = weiToGwei(gasPriceHex)
    const latestBlock = await client.getBlock("latest", true)

    const [chainIdHex, avgBlockTime, tps] = await Promise.all([
      client.getChainId().catch(() => "0x0"),
      calculateAverageBlockTime(client, latestBlockNumber),
      calculateTPS(client),
    ])

    return {
      totalBlocks: latestBlockNumber,
      totalTransactions: latestBlockNumber * 100, // Estimate
      volume24h: "$0.00",
      activeWallets: 0,
      avgBlockTime,
      avgGasPrice: formatGweiValue(gasPrice),
      tps,
      chainId: hexToDecimal(chainIdHex),
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
    if (!tx) return null

    const blockTimestamp = await getBlockTimestamp(client, hexToDecimal(tx.blockNumber || "0x0"))
    const receipt = await client.getTransactionReceipt(hash)
    const transaction = parseTransaction(tx, blockTimestamp)

    if (receipt?.logs) {
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
    return block ? parseBlock(block) : null
  } catch (error) {
    console.error("Error fetching block:", error)
    return null
  }
}

export async function fetchAddressByAddress(rpcUrl, address) {
  const client = createRPCClient(rpcUrl)

  try {
    const [balanceHex, code, txCountHex] = await Promise.all([
      client.getBalance(address),
      client.getCode(address),
      client.getTransactionCount(address),
    ])

    const balanceEth = weiToEth(balanceHex)
    const isContract = isContractCode(code)

    return {
      address,
      balance: formatEthValue(balanceEth),
      balanceEth,
      isContract,
      transactionCount: hexToDecimal(txCountHex),
      code: isContract ? code : undefined,
    }
  } catch (error) {
    console.error("Error fetching address:", error)
    return null
  }
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

      if (!block?.transactions || !Array.isArray(block.transactions)) continue

      const blockTimestamp = hexToDecimal(block.timestamp)

      for (const tx of block.transactions) {
        if (typeof tx !== "object" || !tx.hash) continue

        const isMatch = addressesMatch(tx.from, address) || addressesMatch(tx.to, address)
        if (!isMatch) continue

        const transaction = parseTransaction(tx, blockTimestamp)
        transaction.type = determineTransactionDirection(tx, address)
        transactions.push(transaction)

        if (transactions.length >= BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST) break
      }
    }

    return transactions
  } catch (error) {
    console.error("Error fetching address transactions:", error)
    throw error
  }
}

export async function fetchERC20Transfers(rpcUrl, address) {
  const client = createRPCClient(rpcUrl)

  try {
    const latestBlockNumber = await getLatestBlockNumber(client)
    const fromBlock = Math.max(0, latestBlockNumber - BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_SEARCH_FOR_ADDRESS)
    const paddedAddress = padAddressToBytes32(address)

    // Fetch transfers where address is sender or receiver
    const [logsFrom, logsTo] = await Promise.all([
      client.getLogs({
        fromBlock: decimalToHex(fromBlock),
        toBlock: "latest",
        topics: [ERC20_TOPICS.TRANSFER, paddedAddress, null],
      }),
      client.getLogs({
        fromBlock: decimalToHex(fromBlock),
        toBlock: "latest",
        topics: [ERC20_TOPICS.TRANSFER, null, paddedAddress],
      }),
    ])

    const transfers = []
    const allLogs = [...logsFrom, ...logsTo]

    for (const log of allLogs) {
      const blockNumber = hexToDecimal(log.blockNumber)
      const blockTimestamp = await getBlockTimestamp(client, blockNumber)

      const from = "0x" + log.topics[1].slice(26)
      const to = "0x" + log.topics[2].slice(26)
      const value = hexToDecimal(log.data)
      const isOutgoing = addressesMatch(from, address)

      transfers.push({
        hash: log.transactionHash,
        logIndex: hexToDecimal(log.logIndex),
        blockNumber,
        tokenAddress: log.address,
        from,
        to,
        value: value.toString(),
        formattedValue: formatTokenValue(value),
        type: isOutgoing ? TX_DIRECTION.SEND : TX_DIRECTION.RECEIVE,
        timestamp: formatTimestamp(blockTimestamp),
        timeAgo: getTimeAgo(blockTimestamp),
      })
    }

    // Remove duplicates and sort
    return transfers
      .filter((t, i, self) => i === self.findIndex((x) => x.hash === t.hash && x.logIndex === t.logIndex))
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST)
  } catch (error) {
    console.error("Error fetching ERC20 transfers:", error)
    return []
  }
}

function extractInternalTxsFromTrace(trace, parentTxHash, targetAddress, depth = 0) {
  const internalTxs = []
  if (!trace) return internalTxs

  const from = normalizeAddress(trace.from)
  const to = normalizeAddress(trace.to)
  const target = normalizeAddress(targetAddress)

  // Check if this call involves the target address (excluding depth 0)
  if (depth > 0 && (from === target || to === target)) {
    const value = trace.value ? hexToDecimal(trace.value) : 0

    internalTxs.push({
      parentTxHash,
      type: trace.type || INTERNAL_TX_TYPES.CALL,
      from: trace.from || "0x0",
      to: trace.to || "Contract Creation",
      value: value.toString(),
      formattedValue: formatEthValue(weiToEth(decimalToHex(value))),
      gasUsed: trace.gasUsed ? hexToDecimal(trace.gasUsed) : 0,
      input: trace.input,
      output: trace.output,
      depth,
      error: trace.error,
      direction: from === target ? TX_DIRECTION.SEND : TX_DIRECTION.RECEIVE,
    })
  }

  // Recursively process nested calls
  if (Array.isArray(trace.calls)) {
    for (const call of trace.calls) {
      internalTxs.push(...extractInternalTxsFromTrace(call, parentTxHash, targetAddress, depth + 1))
    }
  }

  return internalTxs
}

export async function fetchInternalTransactions(rpcUrl, address) {
  const client = createRPCClient(rpcUrl)

  try {
    const transactions = await fetchAddressTransactions(rpcUrl, address)
    const latestBlockNumber = await getLatestBlockNumber(client)
    const blocksToSearch = Math.min(BLOCKCHAIN_CONFIG.MAX_BLOCKS_TO_SEARCH_FOR_ADDRESS, latestBlockNumber)

    const txHashesToTrace = new Set(transactions.map((tx) => tx.hash))

    // Find contract calls that might have internal txs
    for (let i = 0; i < blocksToSearch; i++) {
      const blockNumber = latestBlockNumber - i
      const block = await client.getBlock(blockNumber, true)

      if (!block?.transactions) continue

      for (const tx of block.transactions) {
        if (typeof tx === "object" && tx.hash && tx.to && tx.input && tx.input !== "0x") {
          txHashesToTrace.add(tx.hash)
        }
      }

      if (txHashesToTrace.size >= BLOCKCHAIN_CONFIG.MAX_TX_HASHES_TO_TRACE) break
    }

    const internalTxs = []

    for (const txHash of txHashesToTrace) {
      try {
        const trace = await client.traceTransaction(txHash)
        if (!trace) continue

        const tx = await client.getTransaction(txHash)
        const blockTimestamp = tx?.blockNumber
          ? await getBlockTimestamp(client, hexToDecimal(tx.blockNumber))
          : Date.now() / 1000

        const extracted = extractInternalTxsFromTrace(trace, txHash, address, 0)

        for (const internalTx of extracted) {
          internalTx.timestamp = formatTimestamp(blockTimestamp)
          internalTx.timeAgo = getTimeAgo(blockTimestamp)
          internalTx.blockNumber = tx?.blockNumber ? hexToDecimal(tx.blockNumber) : 0
        }

        internalTxs.push(...extracted)
      } catch {
        // Tracing might not be available, skip silently
      }
    }

    return internalTxs
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, BLOCKCHAIN_CONFIG.MAX_TRANSACTIONS_PER_REQUEST)
  } catch (error) {
    console.error("Error fetching internal transactions:", error)
    return []
  }
}
