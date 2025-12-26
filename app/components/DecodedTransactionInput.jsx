import { FileCode, ChevronDown, ChevronUp } from "lucide-react"
import { extractFunctionSelector, findMatchingFunction, decodeInputData } from "../lib/AbiDecoder"
import { useState } from "react"

export default function DecodedTransactionInput({ inputData, abi, inline = false }) {
  const [expanded, setExpanded] = useState(false)

  if (!inputData || inputData === "0x") {
    return null
  }

  const selector = extractFunctionSelector(inputData)
  const matchingFunction = findMatchingFunction(abi, selector)

  if (!matchingFunction) {
    return (
      <p className="text-sm text-muted-foreground">
        Function not found in ABI. The function selector is{" "}
        <code className="bg-muted px-1 py-0.5 rounded">{selector}</code>
      </p>
    )
  }

  const decodedParams = decodeInputData(inputData, matchingFunction)

  const formatValue = (value, type) => {
    if (type === "address") {
      return value.slice(0, 6) + "..." + value.slice(-4)
    }
    if (value.length > 16) {
      return value.slice(0, 10) + "..." + value.slice(-4)
    }
    return value
  }

  const functionSignature = `${matchingFunction.name}(${decodedParams.map((p) => formatValue(p.value, p.type)).join(", ")})`

  if (inline) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm text-[oklch(0.65_0.25_151)]">{functionSignature}</code>
        <span className="badge badge-secondary text-xs">{matchingFunction.stateMutability || "nonpayable"}</span>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-content space-y-3 mt-6">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-semibold text-[oklch(0.65_0.25_151)]">{matchingFunction.name}</code>
          <span className="badge badge-secondary text-xs">{matchingFunction.stateMutability || "nonpayable"}</span>
        </div>

        {decodedParams.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 font-mono text-sm">
            <div className="flex items-start justify-between gap-2">
              <code className="break-all text-foreground">
                {matchingFunction.name}(
                {!expanded && decodedParams.length > 2 ? (
                  <span className="text-muted-foreground">{decodedParams.length} params</span>
                ) : (
                  decodedParams.map((param, index) => (
                    <span key={index}>
                      {index > 0 && ", "}
                      <span className="text-muted-foreground">{param.name}:</span>{" "}
                      <span className="text-[oklch(0.65_0.25_151)]">
                        {expanded ? param.value : formatValue(param.value, param.type)}
                      </span>
                    </span>
                  ))
                )}
                )
              </code>
              {(decodedParams.length > 2 || decodedParams.some((p) => p.value.length > 16)) && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-1">
                {decodedParams.map((param, index) => (
                  <div key={index} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground w-24 flex-shrink-0">{param.type}</span>
                    <span className="text-muted-foreground">{param.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
