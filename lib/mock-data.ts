// Mock data for blockchain transactions and blocks

export interface Transaction {
  hash: string
  from: string
  to: string
  amount: string
  value: number
  type: "send" | "receive"
  timestamp: string
  timeAgo: string
  status: "success" | "pending" | "failed"
  blockNumber: number
  gasUsed: string
  gasPrice: string
  input?: string
}

export interface Block {
  number: number
  hash: string
  timestamp: string
  timeAgo: string
  transactions: number
  miner: string
  gasUsed: string
  gasLimit: string
  size: string
  reward: string
}

export interface Stats {
  totalBlocks: number
  totalTransactions: number
  volume24h: string
  activeWallets: number
  avgBlockTime: string
  avgGasPrice: string
  tps?: string
  chainId?: number
  latestBlockTransactions?: number
}

export interface Address {
  address: string
  balance: string
  balanceEth: number
  isContract: boolean
  transactionCount: number
  code?: string
}

export const mockTransactions: Transaction[] = [
  {
    hash: "0x7f9a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8",
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    to: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    amount: "2.45 ETH",
    value: 2.45,
    type: "send",
    timestamp: "2025-12-22 14:23:45",
    timeAgo: "2 mins ago",
    status: "success",
    blockNumber: 2453678,
    gasUsed: "21000",
    gasPrice: "25 Gwei",
    input: "0x1234567890abcdef",
  },
  {
    hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    from: "0x9f4cB7d3b2a1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    amount: "0.87 ETH",
    value: 0.87,
    type: "receive",
    timestamp: "2025-12-22 14:20:15",
    timeAgo: "5 mins ago",
    status: "success",
    blockNumber: 2453676,
    gasUsed: "21000",
    gasPrice: "23 Gwei",
  },
  {
    hash: "0xa9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9",
    from: "0x5a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4",
    to: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    amount: "5.23 ETH",
    value: 5.23,
    type: "send",
    timestamp: "2025-12-22 14:13:30",
    timeAgo: "12 mins ago",
    status: "pending",
    blockNumber: 2453675,
    gasUsed: "21000",
    gasPrice: "28 Gwei",
  },
  {
    hash: "0x3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3",
    from: "0x4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    amount: "1.12 ETH",
    value: 1.12,
    type: "receive",
    timestamp: "2025-12-22 14:07:20",
    timeAgo: "18 mins ago",
    status: "success",
    blockNumber: 2453672,
    gasUsed: "21000",
    gasPrice: "22 Gwei",
  },
  {
    hash: "0x9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9",
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    to: "0x6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6",
    amount: "3.78 ETH",
    value: 3.78,
    type: "send",
    timestamp: "2025-12-22 14:00:05",
    timeAgo: "25 mins ago",
    status: "failed",
    blockNumber: 2453670,
    gasUsed: "21000",
    gasPrice: "30 Gwei",
  },
  {
    hash: "0x5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5",
    from: "0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    amount: "0.54 ETH",
    value: 0.54,
    type: "receive",
    timestamp: "2025-12-22 13:53:40",
    timeAgo: "32 mins ago",
    status: "success",
    blockNumber: 2453668,
    gasUsed: "21000",
    gasPrice: "24 Gwei",
  },
  {
    hash: "0x8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8",
    from: "0x3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3",
    to: "0xf5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6",
    amount: "6.92 ETH",
    value: 6.92,
    type: "send",
    timestamp: "2025-12-22 13:48:22",
    timeAgo: "37 mins ago",
    status: "success",
    blockNumber: 2453665,
    gasUsed: "21000",
    gasPrice: "26 Gwei",
  },
  {
    hash: "0xb6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6",
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    to: "0xd3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4",
    amount: "0.33 ETH",
    value: 0.33,
    type: "send",
    timestamp: "2025-12-22 13:42:11",
    timeAgo: "43 mins ago",
    status: "success",
    blockNumber: 2453662,
    gasUsed: "21000",
    gasPrice: "27 Gwei",
  },
]

export const mockBlocks: Block[] = [
  {
    number: 2453678,
    hash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    timestamp: "2025-12-22 14:23:45",
    timeAgo: "2 mins ago",
    transactions: 156,
    miner: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    gasUsed: "12,456,789",
    gasLimit: "15,000,000",
    size: "24.5 KB",
    reward: "2.5 ETH",
  },
  {
    number: 2453677,
    hash: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    timestamp: "2025-12-22 14:21:33",
    timeAgo: "4 mins ago",
    transactions: 142,
    miner: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    gasUsed: "11,234,567",
    gasLimit: "15,000,000",
    size: "22.8 KB",
    reward: "2.5 ETH",
  },
  {
    number: 2453676,
    hash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    timestamp: "2025-12-22 14:20:15",
    timeAgo: "5 mins ago",
    transactions: 178,
    miner: "0x9f4cB7d3b2a1c0d9e8f7a6b5c4d3e2f1a0b9c8d7",
    gasUsed: "13,567,890",
    gasLimit: "15,000,000",
    size: "26.3 KB",
    reward: "2.5 ETH",
  },
  {
    number: 2453675,
    hash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    timestamp: "2025-12-22 14:18:02",
    timeAgo: "7 mins ago",
    transactions: 163,
    miner: "0x5a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5",
    gasUsed: "12,890,123",
    gasLimit: "15,000,000",
    size: "25.1 KB",
    reward: "2.5 ETH",
  },
  {
    number: 2453674,
    hash: "0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    timestamp: "2025-12-22 14:15:48",
    timeAgo: "10 mins ago",
    transactions: 134,
    miner: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    gasUsed: "10,456,789",
    gasLimit: "15,000,000",
    size: "21.2 KB",
    reward: "2.5 ETH",
  },
  {
    number: 2453673,
    hash: "0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
    timestamp: "2025-12-22 14:13:30",
    timeAgo: "12 mins ago",
    transactions: 189,
    miner: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    gasUsed: "14,123,456",
    gasLimit: "15,000,000",
    size: "27.8 KB",
    reward: "2.5 ETH",
  },
]

export const mockStats: Stats = {
  totalBlocks: 2453678,
  totalTransactions: 15234567,
  volume24h: "$45.8M",
  activeWallets: 89234,
  avgBlockTime: "12.5s",
  avgGasPrice: "25 Gwei",
  tps: "300",
  chainId: 1,
  latestBlockTransactions: 156,
}

// Simulated API calls with delay
export async function fetchTransactions(): Promise<Transaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return mockTransactions
}

export async function fetchBlocks(): Promise<Block[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return mockBlocks
}

export async function fetchStats(): Promise<Stats> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return mockStats
}

export async function fetchTransactionById(hash: string): Promise<Transaction | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockTransactions.find((tx) => tx.hash === hash) || null
}

export async function fetchBlockById(number: number): Promise<Block | null> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return mockBlocks.find((block) => block.number === number) || null
}

export async function fetchAddressData(address: string): Promise<Address | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // Mock data for address
  const mockAddress: Address = {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    balance: "10.0 ETH",
    balanceEth: 10.0,
    isContract: false,
    transactionCount: 100,
  }
  return address === mockAddress.address ? mockAddress : null
}
