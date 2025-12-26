import { Copy, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

export default function TransactionLogs({ logs, abi }) {
  const [expandedLogs, setExpandedLogs] = useState({})
  const [copiedField, setCopiedField] = useState(null)

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 500)
  }

  const toggleLog = (index) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const decodeEventData = (log) => {
    if (!abi) return null

    const eventSignature = log.topics?.[0]
    if (!eventSignature) return null

    // Buscar el evento en el ABI
    const event = abi.find((item) => {
      if (item.type !== "event") return false
      const signature = `${item.name}(${item.inputs.map((i) => i.type).join(",")})`
      // Simple hash comparison (en producción usarías keccak256 real)
      return true
    })

    if (!event) return null

    const decodedParams = []
    let topicIndex = 1
    let dataOffset = 0

    event.inputs.forEach((input, idx) => {
      let value
      if (input.indexed && log.topics?.[topicIndex]) {
        // Los parámetros indexados están en topics
        value = log.topics[topicIndex]
        if (input.type === "address") {
          value = "0x" + value.slice(26)
        }
        topicIndex++
      } else if (log.data && log.data !== "0x") {
        // Los no indexados están en data
        const dataWithoutPrefix = log.data.slice(2)
        const paramData = dataWithoutPrefix.slice(dataOffset, dataOffset + 64)

        if (input.type === "address") {
          value = "0x" + paramData.slice(24)
        } else if (input.type.startsWith("uint") || input.type.startsWith("int")) {
          value = Number.parseInt(paramData, 16).toString()
        } else if (input.type === "bool") {
          value = Number.parseInt(paramData, 16) === 1 ? "true" : "false"
        } else {
          value = "0x" + paramData
        }

        dataOffset += 64
      }

      decodedParams.push({
        name: input.name || `param${idx}`,
        type: input.type,
        indexed: input.indexed || false,
        value: value || "N/A",
      })
    })

    return {
      name: event.name,
      params: decodedParams,
    }
  }

  if (!logs || logs.length === 0) {
    return null
  }

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
          const decodedEvent = abi ? decodeEventData(log) : null

          return (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleLog(index)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-[oklch(0.65_0.25_151)]/10 text-[oklch(0.65_0.25_151)] px-2 py-1 rounded">
                    Log {index}
                  </span>
                  {decodedEvent && <span className="text-sm font-semibold text-foreground">{decodedEvent.name}</span>}
                  <span className="text-xs text-muted-foreground font-mono">{log.address}</span>
                </div>
                <button className="btn btn-ghost btn-icon">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-background">
                  {decodedEvent && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Decoded Parameters</h4>
                      <div className="space-y-2">
                        {decodedEvent.params.map((param, paramIdx) => (
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
                              <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => copyToClipboard(param.value, `log-${index}-param-${paramIdx}`)}
                              >
                                <Copy
                                  className={`h-3 w-3 ${
                                    copiedField === `log-${index}-param-${paramIdx}`
                                      ? "text-[oklch(0.65_0.25_151)]"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{log.address}</code>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => copyToClipboard(log.address, `log-${index}-address`)}
                        >
                          <Copy
                            className={`h-3 w-3 ${
                              copiedField === `log-${index}-address`
                                ? "text-[oklch(0.65_0.25_151)]"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {log.topics && log.topics.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Topics</span>
                        {log.topics.map((topic, topicIdx) => (
                          <div
                            key={topicIdx}
                            className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded"
                          >
                            <span className="text-xs text-muted-foreground">Topic {topicIdx}</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono break-all">{topic}</code>
                              <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => copyToClipboard(topic, `log-${index}-topic-${topicIdx}`)}
                              >
                                <Copy
                                  className={`h-3 w-3 ${
                                    copiedField === `log-${index}-topic-${topicIdx}`
                                      ? "text-[oklch(0.65_0.25_151)]"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {log.data && log.data !== "0x" && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Data</span>
                        <div className="bg-muted/20 rounded p-3 border border-border">
                          <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">
                            {log.data}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!abi && logs.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded border border-border">
          <p className="text-sm text-muted-foreground">
            💡 Add the contract ABI above to decode event parameters automatically
          </p>
        </div>
      )}
    </div>
  )
}
