import { extractFunctionSelector, findMatchingFunction, decodeInputData } from "../lib/AbiDecoder"
import { LogHeader, DecodedParams } from "./TransactionsLogs"
import { useState } from "react"
import { ethers } from "ethers";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";

const COPY_FEEDBACK_DURATION = 500

export default function DecodedTransactionInput({ inputData, abi, inline = false }) {
  const [expanded, setExpanded] = useState(true)
  const iface = new ethers.Interface(abi);

  if (!inputData || inputData === "0x") {
    return null
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 500)
  }

  const selector = extractFunctionSelector(inputData)
  const matchingFunction = findMatchingFunction(abi, selector)

  const decodedParamsReadable = iface.decodeFunctionData(selector, inputData)
  const functionValues = iface.getFunction(selector);

  const decodedValues = functionValues.inputs.map((input, index) => ({
    name: input.name,
    type: input.type,
    value: decodedParamsReadable[index],
  }));

  if (!matchingFunction) {
    return (
      <p className="text-sm text-muted-foreground">
        Function not found in ABI. The function selector is{" "}
        <code className="bg-muted px-1 py-0.5 rounded">{selector}</code>
      </p>
    )
  }

  const functionSignature = `${matchingFunction.name}(${decodedValues.map((p) => (p.value)).join(", ")})`

  if (inline) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm text-[oklch(0.65_0.25_151)]">{functionSignature}</code>
        <span className="badge badge-secondary text-xs">{matchingFunction.stateMutability || "nonpayable"}</span>
      </div>
    )
  }

  return (
    <div className="">
      <div key={0} className="border border-border rounded-lg overflow-hidden">
        <LogHeader
          index={0}
          decodedEvent={{name: matchingFunction?.name}}
          isExpanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          pillText={matchingFunction.stateMutability || "nonpayable"}
        />

        {expanded && (
          <div className="p-4 space-y-4 bg-background">
            <DecodedParams
              params={decodedValues}
              onCopy={copyToClipboard}
              copiedField={""}
              logIndex={0}
            />
          </div>
        )}
      </div>
    </div>
  )
}
