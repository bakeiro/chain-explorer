import { FileCode } from "lucide-react"
import { extractFunctionSelector, findMatchingFunction, decodeInputData } from "../lib/AbiDecoder"

export default function DecodedTransactionInput({ inputData, abi }) {
  if (!inputData || inputData === "0x") {
    return null
  }

  const selector = extractFunctionSelector(inputData)
  const matchingFunction = findMatchingFunction(abi, selector)

  if (!matchingFunction) {
    return (
      <p className="text-xs text-muted-foreground">
        Function not found in ABI. The function selector is{" "}
        <code className="bg-muted px-1 py-0.5 rounded">{selector}</code>
      </p>
    )
  }

  const decodedParams = decodeInputData(inputData, matchingFunction)

  return (
    <div className="card">
      <div className="card-content mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Function:</span>
          <code className="text-sm font-semibold">{matchingFunction.name}</code>
          <span className="badge badge-secondary text-xs">{matchingFunction.stateMutability || "nonpayable"}</span>
        </div>

        {decodedParams.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Parameters</div>
            <div className="space-y-2">
              {decodedParams.map((param, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{param.name}</span>
                    <span className="badge badge-outline text-xs">{param.type}</span>
                  </div>
                  <code className="text-xs break-all block text-muted-foreground">{param.value}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
