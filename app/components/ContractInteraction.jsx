import { useState, useEffect } from "react"
import { useBlockchain } from "../App"
import { parseABI, getFunctionSignature } from "../lib/AbiDecoder"
import RPCClient from "../lib/RpcClient"
import { ethers } from "ethers"
import { FileCode, ChevronDown, ChevronRight, Trash2, Play, Loader2, Copy, Check } from "lucide-react"

export default function ContractInteraction({ contractAddress, onABIParsed }) {
  const [abiInput, setAbiInput] = useState("")
  const [parsedABI, setParsedABI] = useState(null)
  const [error, setError] = useState("")
  const [expandedFunctions, setExpandedFunctions] = useState(new Set())
  const [functionInputs, setFunctionInputs] = useState({})
  const [functionResults, setFunctionResults] = useState({})
  const [loadingFunctions, setLoadingFunctions] = useState({})
  const [copiedResult, setCopiedResult] = useState(null)
  const { rpcUrl, getContractABI, saveContractABI, removeContractABI } = useBlockchain()

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
    setFunctionInputs({})
    setFunctionResults({})
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

  const handleInputChange = (signature, inputIndex, value) => {
    setFunctionInputs((prev) => ({
      ...prev,
      [signature]: {
        ...(prev[signature] || {}),
        [inputIndex]: value,
      },
    }))
  }

  const callViewFunction = async (func) => {
    const signature = getFunctionSignature(func)
    setLoadingFunctions((prev) => ({ ...prev, [signature]: true }))
    setFunctionResults((prev) => ({ ...prev, [signature]: null }))

    try {
      const iface = new ethers.Interface(parsedABI)
      const inputs = functionInputs[signature] || {}

      // Build arguments array
      const args = func.inputs.map((input, i) => {
        const value = inputs[i] || ""
        // Parse arrays
        if (input.type.endsWith("[]")) {
          try {
            return JSON.parse(value)
          } catch {
            return value.split(",").map((v) => v.trim())
          }
        }
        // Parse tuples
        if (input.type === "tuple" || input.type.startsWith("tuple")) {
          try {
            return JSON.parse(value)
          } catch {
            return value
          }
        }
        return value
      })

      // Encode function call
      const data = iface.encodeFunctionData(func.name, args)

      // Execute eth_call
      const rpcClient = new RPCClient(rpcUrl)
      const result = await rpcClient.ethCall(contractAddress, data)

      // Decode result
      const decoded = iface.decodeFunctionResult(func.name, result)

      // Format result
      let formattedResult
      if (decoded.length === 1) {
        formattedResult = formatValue(decoded[0], func.outputs[0]?.type)
      } else {
        formattedResult = func.outputs.map((output, i) => ({
          name: output.name || `result${i}`,
          type: output.type,
          value: formatValue(decoded[i], output.type),
        }))
      }

      setFunctionResults((prev) => ({
        ...prev,
        [signature]: { success: true, data: formattedResult },
      }))
    } catch (err) {
      setFunctionResults((prev) => ({
        ...prev,
        [signature]: { success: false, error: err.message || "Call failed" },
      }))
    } finally {
      setLoadingFunctions((prev) => ({ ...prev, [signature]: false }))
    }
  }

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return "null"
    if (typeof value === "bigint") return value.toString()
    if (Array.isArray(value)) {
      return value.map((v, i) => formatValue(v, type?.replace("[]", ""))).join(", ")
    }
    if (typeof value === "object" && value.toString) {
      return value.toString()
    }
    return String(value)
  }

  const copyResult = (signature) => {
    const result = functionResults[signature]
    if (result?.success) {
      const text = typeof result.data === "object" ? JSON.stringify(result.data, null, 2) : String(result.data)
      navigator.clipboard.writeText(text)
      setCopiedResult(signature)
      setTimeout(() => setCopiedResult(null), 1500)
    }
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

  const isViewFunction = (func) => {
    return func.stateMutability === "view" || func.stateMutability === "pure"
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

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {parsedABI
                .filter((item) => item.type === "function")
                .map((func, index) => {
                  const signature = getFunctionSignature(func)
                  const isExpanded = expandedFunctions.has(signature)
                  const isView = isViewFunction(func)
                  const isLoading = loadingFunctions[signature]
                  const result = functionResults[signature]

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
                              <div className="space-y-2">
                                {func.inputs.map((input, i) => (
                                  <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-medium">{input.name || `param${i}`}</span>
                                      <span className="text-muted-foreground">{input.type}</span>
                                    </div>
                                    {isView && (
                                      <input
                                        type="text"
                                        placeholder={`Enter ${input.type}`}
                                        value={functionInputs[signature]?.[i] || ""}
                                        onChange={(e) => handleInputChange(signature, i, e.target.value)}
                                        className="input input-sm w-full font-mono text-xs"
                                      />
                                    )}
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

                          {isView && (
                            <button
                              onClick={() => callViewFunction(func)}
                              disabled={isLoading}
                              className="btn btn-primary btn-sm w-full"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Calling...
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Call
                                </>
                              )}
                            </button>
                          )}

                          {!isView && (
                            <div className="text-xs text-muted-foreground italic">
                              Write functions require wallet connection (coming soon)
                            </div>
                          )}

                          {result && (
                            <div className={`p-2 rounded text-xs ${result.success ? "bg-muted" : "bg-destructive/10"}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{result.success ? "Result" : "Error"}</span>
                                {result.success && (
                                  <button
                                    onClick={() => copyResult(signature)}
                                    className="p-1 hover:bg-background rounded transition-colors"
                                  >
                                    {copiedResult === signature ? (
                                      <Check className="w-3 h-3 text-[oklch(0.65_0.25_151)]" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                              {result.success ? (
                                Array.isArray(result.data) ? (
                                  <div className="space-y-1">
                                    {result.data.map((item, i) => (
                                      <div key={i} className="flex justify-between font-mono">
                                        <span className="text-muted-foreground">{item.name}:</span>
                                        <span className="break-all max-w-[70%] text-right">{item.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <code className="font-mono break-all">{String(result.data)}</code>
                                )
                              ) : (
                                <span className="text-destructive">{result.error}</span>
                              )}
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
