import { useState, useCallback } from "react"
import { Copy, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Interface } from "ethers"
import { truncateAddress } from "../lib/Formatters"

const COPY_FEEDBACK_DURATION = 500

/**
 * Decode event log using ethers Interface
 */
function decodeEventLog(log, abi) {
  if (!abi?.length) return null

  try {
    const iface = new Interface(abi)
    const parsedLog = iface.parseLog({
      topics: log.topics,
      data: log.data,
    })

    if (!parsedLog) return null

    const decodedParams = parsedLog.fragment.inputs.map((input, idx) => {
      let value = parsedLog.args[idx]

      if (typeof value === "bigint") {
        value = value.toString()
      } else if (value?.toString) {
        value = value.toString()
      }

      return {
        name: input.name || `param${idx}`,
        type: input.type,
        indexed: input.indexed ?? false,
        value: value ?? "N/A",
      }
    })

    return {
      name: parsedLog.name,
      signature: parsedLog.signature,
      params: decodedParams,
    }
  } catch (error) {
    return null
  }
}

export function LogHeader({ index, decodedEvent, isExpanded, onToggle, pillText = "Log %index%" }) {
  
  const pillTextUpdated = pillText.replace("%index%", index);

  return (
    <div
      className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-mono bg-[oklch(0.65_0.25_151)]/10 text-[oklch(0.65_0.25_151)] px-2 py-1 rounded">
          {pillTextUpdated}
        </span>

        {decodedEvent && <span className="text-sm font-semibold text-foreground">{decodedEvent.name}</span>}

      </div>
      <button className="btn btn-ghost btn-icon">
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  )
}

export function DecodedParams({ params, onCopy, copiedField, logIndex }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Decoded Parameters</h4>
      <div className="space-y-2">
        {params.map((param, paramIdx) => (
          <div
            key={paramIdx}
            className="flex items-start justify-between py-2 px-3 bg-muted/20 rounded border border-border"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{param.type}</span>
              <span className="text-sm font-medium">{param.name}</span>
              {param.indexed && (
                <span className="text-xs bg-[oklch(0.65_0.25_151)]/10 text-[oklch(0.65_0.25_151)] px-1.5 py-0.5 rounded">
                  indexed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono break-all">{param.value}</code>
              <CopyButton
                value={param.value}
                field={`log-${logIndex}-param-${paramIdx}`}
                copiedField={copiedField}
                onCopy={onCopy}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CopyButton({ value, field, copiedField, onCopy }) {
  const isCopied = copiedField === field
  return (
    <button className="btn btn-ghost btn-icon" onClick={() => onCopy(value, field)}>
      <Copy className={`h-3 w-3 ${isCopied ? "text-[oklch(0.65_0.25_151)]" : "text-muted-foreground"}`} />
    </button>
  )
}

function RawLogData({ log, logIndex, copiedField, isDifferentContract, onCopy }) {
  return (
    <div className="space-y-3">

      {/*}
      {log.data && log.data !== "0x" && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Data</span>
          <div className="bg-muted/20 rounded p-3 border border-border">
            <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">{log.data}</code>
          </div>
        </div>
      )}
      */}

      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">Address</span>
        <div className="flex items-center gap-2">
          {isDifferentContract && (
            <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">External Contract</span>
          )}
          <code className="text-sm font-mono">{log.address}</code>
          <CopyButton value={log.address} field={`log-${logIndex}-address`} copiedField={copiedField} onCopy={onCopy} />
        </div>
      </div>

      {/*
      {log.topics?.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Topics</span>
          {log.topics.map((topic, topicIdx) => (
            <div key={topicIdx} className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded">
              <span className="text-xs text-muted-foreground">Topic {topicIdx}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all">{topic}</code>
                <CopyButton
                  value={topic}
                  field={`log-${logIndex}-topic-${topicIdx}`}
                  copiedField={copiedField}
                  onCopy={onCopy}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      */}

      
    </div>
  )
}

function MissingABINotice({ address, onNavigate }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <p className="text-amber-700">
          This event was emitted by an external contract. To decode its parameters, add the ABI for this contract.
        </p>
        <button
          className="mt-2 text-[oklch(0.65_0.25_151)] hover:underline font-medium"
          onClick={() => onNavigate?.("address", { address })}
        >
          Go to contract {truncateAddress(address)} to add ABI
        </button>
      </div>
    </div>
  )
}

export default function TransactionLogs({ logs, abi, getContractABI, transactionTo, onNavigate }) {
  const [expandedLogs, setExpandedLogs] = useState({})
  const [copiedField, setCopiedField] = useState(null)

  const copyToClipboard = useCallback((text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), COPY_FEEDBACK_DURATION)
  }, [])

  const toggleLog = useCallback((index) => {
    setExpandedLogs((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  if (!logs?.length) return null

  const normalizedTxTo = transactionTo?.toLowerCase()

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Events / Logs</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {logs.length} event{logs.length !== 1 ? "s" : ""} emitted during transaction execution
        </p>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => {
          const isExpanded = expandedLogs[index]
          const logAddress = log.address?.toLowerCase()

          const isDifferentContract = normalizedTxTo && logAddress !== normalizedTxTo

          let abiForLog = abi
          if (isDifferentContract && getContractABI) {
            const externalABI = getContractABI(log.address)
            if (externalABI) {
              abiForLog = externalABI
            }
          }

          const decodedEvent = decodeEventLog(log, abiForLog)
          const needsExternalABI = isDifferentContract && !decodedEvent && getContractABI

          return (
            <div key={index} className="border border-border rounded-lg overflow-hidden">

              <LogHeader
                index={index}
                decodedEvent={decodedEvent}
                address={log.address}
                isExpanded={isExpanded}
                onToggle={() => toggleLog(index)}
                isDifferentContract={isDifferentContract}
                onNavigate={onNavigate}
              />

              {isExpanded && (
                <div className="p-4 space-y-4 bg-background">
                  <RawLogData isDifferentContract={isDifferentContract} log={log} logIndex={index} copiedField={copiedField} onCopy={copyToClipboard} />
                  {needsExternalABI && <MissingABINotice address={log.address} onNavigate={onNavigate} />}

                  {decodedEvent && (
                    <DecodedParams
                      params={decodedEvent.params}
                      onCopy={copyToClipboard}
                      copiedField={copiedField}
                      logIndex={index}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!abi && logs.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded border border-border">
          <p className="text-sm text-muted-foreground">
            Add the contract ABI above to decode event parameters automatically
          </p>
        </div>
      )}
    </div>
  )
}
