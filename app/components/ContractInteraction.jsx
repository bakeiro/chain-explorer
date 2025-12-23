 

import { useState, useEffect } from "react"
import { useBlockchain } from "../App"
import { parseABI, getFunctionSignature } from "../lib/AbiDecoder"
import { FileCode, ChevronDown, ChevronRight, Trash2 } from "lucide-react"

export default function ContractInteraction({ contractAddress, onABIParsed }) {
  const [abiInput, setAbiInput] = useState("")
  const [parsedABI, setParsedABI] = useState(null)
  const [error, setError] = useState("")
  const [expandedFunctions, setExpandedFunctions] = useState(new Set())
  const { getContractABI, saveContractABI, removeContractABI } = useBlockchain()

  useEffect(() => {
    const savedABI = getContractABI(contractAddress)
    if (savedABI) {
      setParsedABI(savedABI)
      onABIParsed?.(savedABI)
    }
  }, [contractAddress])

  const handleParseABI = () => {
    try {
      setError("")
      const abi = parseABI(abiInput)
      setParsedABI(abi)
      saveContractABI(contractAddress, abi)
      onABIParsed?.(abi)
      setAbiInput("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse ABI")
      setParsedABI(null)
    }
  }

  const handleRemoveABI = () => {
    setParsedABI(null)
    removeContractABI(contractAddress)
    onABIParsed?.([])
  }

  const toggleFunction = (functionName) => {
    setExpandedFunctions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(functionName)) {
        newSet.delete(functionName)
      } else {
        newSet.add(functionName)
      }
      return newSet
    })
  }

  const getFunctionMutabilityClass = (mutability) => {
    switch (mutability) {
      case "view":
      case "pure":
        return "badge-secondary"
      case "payable":
        return "badge-default"
      default:
        return "badge-outline"
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <FileCode className="w-5 h-5" />
          Contract Interaction
        </h3>
      </div>
      <div className="card-content space-y-4">
        {!parsedABI ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Paste Contract ABI</label>
              <textarea
                placeholder='[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],...}]'
                value={abiInput}
                onChange={(e) => setAbiInput(e.target.value)}
                className="textarea min-h-[200px] font-mono text-sm"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <button onClick={handleParseABI} className="btn btn-primary w-full btn-md">
              Parse ABI
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {parsedABI.filter((f) => f.type === "function").length} functions found
              </div>
              <button onClick={handleRemoveABI} className="btn btn-outline btn-sm">
                <Trash2 className="w-3 h-3 mr-1" />
                Remove ABI
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {parsedABI
                .filter((item) => item.type === "function")
                .map((func, index) => {
                  const signature = getFunctionSignature(func)
                  const isExpanded = expandedFunctions.has(signature)

                  return (
                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFunction(signature)}
                        className="w-full p-3 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <code className="text-sm font-medium">{func.name}</code>
                          <span className={`badge ${getFunctionMutabilityClass(func.stateMutability)} text-xs`}>
                            {func.stateMutability || "nonpayable"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3 space-y-3 bg-background">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Function Signature</div>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{signature}</code>
                          </div>

                          {func.inputs.length > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">Inputs</div>
                              <div className="space-y-1">
                                {func.inputs.map((input, i) => (
                                  <div key={i} className="text-xs bg-muted/50 px-2 py-1 rounded flex justify-between">
                                    <span className="font-medium">{input.name || `param${i}`}</span>
                                    <span className="text-muted-foreground">{input.type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {func.outputs && func.outputs.length > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">Outputs</div>
                              <div className="space-y-1">
                                {func.outputs.map((output, i) => (
                                  <div key={i} className="text-xs bg-muted/50 px-2 py-1 rounded flex justify-between">
                                    <span className="font-medium">{output.name || `return${i}`}</span>
                                    <span className="text-muted-foreground">{output.type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
