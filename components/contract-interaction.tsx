"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileCode, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { parseABI, type ABIFunction, getFunctionSignature } from "@/lib/abi-decoder"
import { useBlockchain } from "@/contexts/blockchain-context"

interface ContractInteractionProps {
  contractAddress: string
  onABIParsed?: (abi: ABIFunction[]) => void
}

export function ContractInteraction({ contractAddress, onABIParsed }: ContractInteractionProps) {
  const [abiInput, setAbiInput] = useState("")
  const [parsedABI, setParsedABI] = useState<ABIFunction[] | null>(null)
  const [error, setError] = useState("")
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set())
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
    onABIParsed?.([] as ABIFunction[])
  }

  const toggleFunction = (functionName: string) => {
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

  const getFunctionMutabilityColor = (mutability?: string) => {
    switch (mutability) {
      case "view":
      case "pure":
        return "secondary"
      case "payable":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="w-5 h-5" />
          Contract Interaction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parsedABI ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Paste Contract ABI</label>
              <Textarea
                placeholder='[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],...}]'
                value={abiInput}
                onChange={(e) => setAbiInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button onClick={handleParseABI} className="w-full cursor-pointer">
              Parse ABI
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {parsedABI.filter((f) => f.type === "function").length} functions found
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRemoveABI} variant="outline" size="sm" className="cursor-pointer bg-transparent">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove ABI
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {parsedABI
                .filter((item) => item.type === "function")
                .map((func, index) => {
                  const signature = getFunctionSignature(func)
                  const isExpanded = expandedFunctions.has(signature)

                  return (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFunction(signature)}
                        className="w-full p-3 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <code className="text-sm font-medium">{func.name}</code>
                          <Badge variant={getFunctionMutabilityColor(func.stateMutability)} className="text-xs">
                            {func.stateMutability || "nonpayable"}
                          </Badge>
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
      </CardContent>
    </Card>
  )
}
