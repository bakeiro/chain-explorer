export const RPC_CONFIG = {
  DEFAULT_URL: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
  JSON_RPC_VERSION: "2.0",
  CONTENT_TYPE: "application/json",
} as const

export const BLOCKCHAIN_CONFIG = {
  MAX_BLOCKS_TO_FETCH: 10,
  MAX_TRANSACTIONS_PER_REQUEST: 20,
  MAX_TRANSACTIONS_PER_BLOCK: 3,
  MAX_BLOCKS_TO_SEARCH_FOR_ADDRESS: 100,
  WEI_TO_ETH_DIVISOR: 1e18,
  WEI_TO_GWEI_DIVISOR: 1e9,
  DEFAULT_BLOCK_REWARD: "2.0 ETH",
} as const

export const TIME_UNITS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
} as const

export const STORAGE_KEYS = {
  RPC_URL: "blockchain_rpc_url",
  CONTRACT_ABIS: "blockchain_contract_abis",
} as const

export const RPC_METHODS = {
  GET_BLOCK_NUMBER: "eth_blockNumber",
  GET_BLOCK_BY_NUMBER: "eth_getBlockByNumber",
  GET_TRANSACTION_BY_HASH: "eth_getTransactionByHash",
  GET_BALANCE: "eth_getBalance",
  GET_GAS_PRICE: "eth_gasPrice",
  GET_CHAIN_ID: "eth_chainId",
  GET_NET_VERSION: "net_version",
  GET_CODE: "eth_getCode",
  GET_TRANSACTION_RECEIPT: "eth_getTransactionReceipt",
  GET_TRANSACTION_COUNT: "eth_getTransactionCount",
} as const
