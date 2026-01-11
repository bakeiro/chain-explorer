import ContractInteraction from "./ContractInteraction";
import { Copy } from "lucide-react";
import { useState } from "react";

export default function AddressContractCode({ addressData, address }) {
  const [parsedABI, setParsedABI] = useState(null);

  const copyToClipboard = (text, field = null) => {
    navigator.clipboard.writeText(text);
    if (field) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 500);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (!addressData?.isContract) return null;

  return (
    <div className="space-y-6">
      {/* ABI Management */}
      <ContractInteraction
        contractAddress={address}
        onABIParsed={(abi) => setParsedABI(abi.length > 0 ? abi : null)}
      />

      {/* Bytecode */}
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contract Bytecode</h3>
            {addressData?.code && addressData.code !== "0x" && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => copyToClipboard(addressData.code, "bytecode")}
              >
                <Copy
                  className={`h-3 w-3 mr-2 text-muted-foreground`}
                />
                Copy
              </button>
            )}
          </div>
          {addressData?.code && addressData.code !== "0x"
            ? (
              <div className="bg-muted/50 rounded-md p-4 border border-border max-h-64 overflow-auto">
                <code className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">
                  {addressData.code}
                </code>
              </div>
            )
            : (
              <p className="text-muted-foreground text-sm">
                No bytecode available
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
