// RPC Configuration
export const RPC_CONFIG = {
  DEFAULT_URL: "http://localhost:8545",
  JSON_RPC_VERSION: "2.0",
  CONTENT_TYPE: "application/json",
}

// Blockchain limits and defaults
export const BLOCKCHAIN_CONFIG = {
  MAX_BLOCKS_TO_FETCH: 10,
  MAX_TRANSACTIONS_PER_REQUEST: 20,
  MAX_TRANSACTIONS_PER_BLOCK: 3,
  MAX_BLOCKS_TO_SEARCH_FOR_ADDRESS: 100,
  MAX_TX_HASHES_TO_TRACE: 50,
  WEI_TO_ETH_DIVISOR: 1e18,
  WEI_TO_GWEI_DIVISOR: 1e9,
  DEFAULT_BLOCK_REWARD: "2.0 ETH",
  DEFAULT_TOKEN_DECIMALS: 18,
  TPS_BLOCK_SAMPLE_SIZE: 10,
}

// Time constants in seconds
export const TIME_UNITS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
}

// LocalStorage keys
export const STORAGE_KEYS = {
  RPC_URL: "blockchain_rpc_url",
  CONTRACT_ABIS: "blockchain_contract_abis",
  ADDRESS_LABELS: "blockchain_address_labels",
  SAVED_ADDRESSES: "blockchain_saved_addresses",
}

// RPC method names
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
  GET_LOGS: "eth_getLogs",
  DEBUG_TRACE_TRANSACTION: "debug_traceTransaction",
  CALL: "eth_call",
}

// ERC20 event topics
export const ERC20_TOPICS = {
  TRANSFER: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
}

// Internal transaction types
export const INTERNAL_TX_TYPES = {
  CALL: "CALL",
  DELEGATECALL: "DELEGATECALL",
  STATICCALL: "STATICCALL",
  CREATE: "CREATE",
  CREATE2: "CREATE2",
  SELFDESTRUCT: "SELFDESTRUCT",
}

// Transaction directions
export const TX_DIRECTION = {
  SEND: "send",
  RECEIVE: "receive",
}

// Hex address padding length
export const HEX_ADDRESS_PADDING = 64
