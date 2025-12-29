import { Copy, ChevronDown, ChevronUp } from "lucide-react"
import { Interface } from "ethers"
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
    // TODO: check if correct ABI
    if (!abi || !Array.isArray(abi) || abi.length === 0) return null

    try {
      // Crear la Interface de ethers con el ABI
      const iface = new Interface(abi)

      const parsedLog = iface.parseLog(log)

      if (!parsedLog) {
        return {
          name: eventName,
          signature: "",
          params: "",
        }
      }

      // Obtener la definición del evento del ABI para saber qué parámetros están indexados
      const eventFragment = parsedLog.fragment

      // Formatear los parámetros decodificados
      const decodedParams = eventFragment.inputs.map((input, idx) => {
        let value = parsedLog.args[idx]

        // Convertir BigInt a string para mostrar
        if (typeof value === "bigint") {
          value = value.toString()
        } else if (value && typeof value === "object" && value.toString) {
          value = value.toString()
        }

        return {
          name: input.name || `param${idx}`,
          type: input.type,
          indexed: input.indexed || false,
          value: value ?? "N/A",
        }
      })

      return {
        name: parsedLog.name,
        signature: parsedLog.signature,
        params: decodedParams,
      }
    } catch (error) {
      // Si no se puede decodificar, retornar null silenciosamente
      console.log("[v0] Could not decode event:", error.message)
      return null
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
                      <h4 className="text-sm font-medium text-muted-foreground">Decoded input parameters</h4>
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
