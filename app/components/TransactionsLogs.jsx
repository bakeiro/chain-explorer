import { useState, useCallback } from "react"
import { Copy, ChevronDown, ChevronUp } from "lucide-react"
import { Interface } from "ethers"

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

      // Convert BigInt and objects to string
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

function LogHeader({ index, decodedEvent, address, isExpanded, onToggle }) {
  return (
    <div
      className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono bg-[oklch(0.65_0.25_151)]/10 text-[oklch(0.65_0.25_151)] px-2 py-1 rounded">
          Log {index}
        </span>
        {decodedEvent && <span className="text-sm font-semibold text-foreground">{decodedEvent.name}</span>}
        <span className="text-xs text-muted-foreground font-mono">{address}</span>
      </div>
      <button className="btn btn-ghost btn-icon">
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  )
}

function DecodedParams({ params, onCopy, copiedField, logIndex }) {
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

function RawLogData({ log, logIndex, copiedField, onCopy }) {
  return (
    <div className="space-y-3">
      {/* Address */}
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">Address</span>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono">{log.address}</code>
          <CopyButton value={log.address} field={`log-${logIndex}-address`} copiedField={copiedField} onCopy={onCopy} />
        </div>
      </div>

      {/* Topics */}
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

      {/* Data */}
      {log.data && log.data !== "0x" && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Data</span>
          <div className="bg-muted/20 rounded p-3 border border-border">
            <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">{log.data}</code>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TransactionLogs({ logs, abi }) {
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
          const decodedEvent = decodeEventLog(log, abi)

          return (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <LogHeader
                index={index}
                decodedEvent={decodedEvent}
                address={log.address}
                isExpanded={isExpanded}
                onToggle={() => toggleLog(index)}
              />

              {isExpanded && (
                <div className="p-4 space-y-4 bg-background">
                  {decodedEvent && (
                    <DecodedParams
                      params={decodedEvent.params}
                      onCopy={copyToClipboard}
                      copiedField={copiedField}
                      logIndex={index}
                    />
                  )}
                  <RawLogData log={log} logIndex={index} copiedField={copiedField} onCopy={copyToClipboard} />
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
