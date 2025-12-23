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
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2 text-base">
            <FileCode className="w-4 h-4" />
            Decoded Input
          </h3>
        </div>
        <div className="card-content">
          <p className="text-sm text-muted-foreground">
            Function not found in ABI. The function selector is <code className="bg-muted px-1 py-0.5">{selector}</code>
          </p>
        </div>
      </div>
    )
  }

  const decodedParams = decodeInputData(inputData, matchingFunction)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2 text-base">
          <FileCode className="w-4 h-4" />
          Decoded Input
        </h3>
      </div>
      <div className="card-content space-y-4">
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
