"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileCode } from "lucide-react"
import { extractFunctionSelector, findMatchingFunction, decodeInputData, type ABIFunction } from "@/lib/abi-decoder"

interface DecodedTransactionInputProps {
  inputData: string
  abi: ABIFunction[]
}

export function DecodedTransactionInput({ inputData, abi }: DecodedTransactionInputProps) {
  if (!inputData || inputData === "0x") {
    return null
  }

  const selector = extractFunctionSelector(inputData)
  const matchingFunction = findMatchingFunction(abi, selector)

  if (!matchingFunction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode className="w-4 h-4" />
            Decoded Input
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Function not found in ABI. The function selector is <code className="bg-muted px-1 py-0.5">{selector}</code>
          </p>
        </CardContent>
      </Card>
    )
  }

  const decodedParams = decodeInputData(inputData, matchingFunction)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCode className="w-4 h-4" />
          Decoded Input
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Function:</span>
          <code className="text-sm font-semibold">{matchingFunction.name}</code>
          <Badge variant="secondary" className="text-xs">
            {matchingFunction.stateMutability || "nonpayable"}
          </Badge>
        </div>

        {decodedParams.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Parameters</div>
            <div className="space-y-2">
              {decodedParams.map((param, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{param.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {param.type}
                    </Badge>
                  </div>
                  <code className="text-xs break-all block text-muted-foreground">{param.value}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
