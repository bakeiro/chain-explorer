import { useEffect, useState } from "react";
import { useBlockchain, useRouter } from "../App";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Skeleton from "../components/Skeleton";
import Tabs from "../components/Tabs";
import ContractInteraction from "../components/ContractInteraction";
import DecodedTransactionInput from "../components/DecodedTransactionInput";
import { fetchAddressByAddress, fetchAddressTransactions, fetchERC20Transfers, fetchInternalTransactions } from "../lib/BlockchainApi";
import { parseABI } from "../lib/AbiDecoder";
import { queryClient } from "../hooks/useRpcQuery";
import { Bookmark, BookmarkCheck, Copy, Edit2, FileCode, RefreshCw, Tag, Wallet, X } from "lucide-react";

export default function AddressDetailPage({ address }) {
  const [addressData, setAddressData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  // const [isRefreshingTxs, setIsRefreshingTxs] = useState(false)

  const {
    rpcUrl,
    getContractABI,
    saveContractABI,
    removeContractABI,
    getAddressLabel,
    saveAddressLabel,
    removeAddressLabel,
    isAddressSaved,
    saveAddress,
    unsaveAddress,
  } = useBlockchain();
  const { navigate } = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [parsedABI, setParsedABI] = useState(null);  
  const [abiInput, setAbiInput] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const [label, setLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const isSaved = isAddressSaved(address);

  const loadTransactions = async () => {
    if (!rpcUrl || !address) return
    try {
      const data = await fetchAddressTransactions(rpcUrl, address)
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoadingTxs(false)
    }
  }

  useEffect(() => {
    const savedABI = getContractABI(address);
    if (savedABI) {
      setParsedABI(savedABI);
    }
    const savedLabel = getAddressLabel(address);
    if (savedLabel) {
      setLabel(savedLabel);
    }
  }, [address, getContractABI, getAddressLabel]);

  useEffect(() => {
    const loadAddress = async () => {
      if (!rpcUrl || !address) return;
      try {
        const data = await fetchAddressByAddress(rpcUrl, address);
        setAddressData(data);
      } catch (error) {
        console.error("Error fetching address:", error);
      } finally {
        setIsLoadingAddress(false);
      }
    };
    loadAddress();
  }, [rpcUrl, address]);

  useEffect(() => {
    loadTransactions();
  }, [rpcUrl, address]);

  const handleRefreshTransactions = () => {
    setIsLoadingTxs(true)
    queryClient.invalidateQueries({ queryKey: ["rpc", rpcUrl] })
    loadTransactions()
  }

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

  const handleToggleSave = () => {
    if (isSaved) {
      unsaveAddress(address);
    } else {
      saveAddress(address);
    }
  };

  /*
  const handleParseABI = () => {
    try {
      setAbiError("");
      const abi = parseABI(abiInput);
      setParsedABI(abi);
      saveContractABI(address, abi);
      setShowABIInput(false);
      setAbiInput("");
    } catch (err) {
      setAbiError(err instanceof Error ? err.message : "Failed to parse ABI");
    }
  };
  
  const handleRemoveABI = () => {
    removeContractABI(address);
    setParsedABI(null);
  };
  */

  const handleSaveLabel = () => {
    if (labelInput.trim()) {
      saveAddressLabel(address, labelInput.trim());
      setLabel(labelInput.trim());
      setShowLabelInput(false);
      setLabelInput("");
    }
  };

  const handleRemoveLabel = () => {
    removeAddressLabel(address);
    setLabel("");
  };

  const handleEditLabel = () => {
    setLabelInput(label);
    setShowLabelInput(true);
  };

  const OverviewContent = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title text-lg">Address Information</h3>
        </div>
        <div className="card-content space-y-4">
          {isLoadingAddress
            ? (
              <>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Address</div>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </>
            )
            : addressData
            ? (
              <>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm break-all">
                      {addressData.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(addressData.address)}
                      className="btn btn-ghost btn-sm shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedAddress && (
                    <p className="text-xs text-[oklch(0.65_0.25_151)]">
                      Copied to clipboard!
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Balance
                    </div>
                    <div className="text-2xl font-semibold text-foreground">
                      {addressData.balance}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Type
                    </div>
                    <div className="text-2xl font-semibold text-foreground">
                      {addressData.isContract ? "Contract" : "Wallet"}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Transactions
                    </div>
                    <div className="text-2xl font-semibold text-foreground">
                      {addressData.transactionCount}
                    </div>
                  </div>
                </div>
              </>
            )
            : (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading address data</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );

  const TransactionsContent = () => (
    <div className="card">
      <div className="card-header w-[100%] !pt-0">
        <div className="flex items-center justify-between">
        <h3 className="card-title text-lg">Transaction History</h3>
          <button onClick={handleRefreshTransactions} disabled={isLoadingTxs} className="btn btn-outline btn-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTxs ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
      <div className="card-content">
        {isLoadingTxs
          ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )
          : !transactions || transactions.length === 0
          ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )
          : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.hash} className="space-y-3">
                  <div
                    onClick={() =>
                      navigate("transaction-detail", { hash: tx.hash })}
                      className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`badge ${
                              tx.type === "send"
                                ? "badge-destructive"
                                : "badge-default"
                            }`}
                          >
                            {tx.type === "send" ? "OUT" : "IN"}
                          </span>
                          <code className="text-sm text-muted-foreground truncate">
                            {tx.hash}
                          </code>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">From:</span>
                            <code className="text-sm">
                              {tx.from.slice(0, 10)}...
                            </code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">To:</span>
                            <code className="text-sm">
                              {tx.to.slice(0, 10)}...
                            </code>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-semibold">{tx.amount}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.timeAgo}
                        </div>
                      </div>
                    </div>

                    {parsedABI && tx.input && tx.input !== "0x" && (
                      <div
                        className="mt-3 pt-3 border-t border-border-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DecodedTransactionInput
                          inputData={tx.input}
                          abi={parsedABI}
                          inline
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );

  const CodeContent = () => (
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
                  className={`h-3 w-3 mr-2 ${
                    copiedField === "bytecode"
                      ? "text-[oklch(0.65_0.25_151)]"
                      : "text-muted-foreground"
                  }`}
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

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewContent /> },
    ...(addressData?.isContract
      ? [{ id: "code", label: "Code", content: <CodeContent /> }]
      : []),
    {
      id: "transactions",
      label: "Transactions",
      content: <TransactionsContent />,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">
              Address Details
            </h1>

            <div>
              {addressData && (
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-semibold ${
                    addressData.isContract
                      ? "bg-muted text-foreground border border-border"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {addressData.isContract
                    ? (<> <FileCode className="w-5 h-5" /> Contract </>)
                    : (<> <Wallet className="w-5 h-5" /> Wallet </>)}
                </span>
              )}

              <button
                onClick={handleToggleSave}
                className={`btn ml-2 px-2 py-3 ${isSaved ? "btn-primary" : "btn-outline"} flex items-center gap-2`}
              >
                {isSaved
                  ? (<BookmarkCheck className="w-5 h-5" />)
                  : (<Bookmark className="w-5 h-5" />)
                }
              </button>
            </div>
          </div>

          <div className="float-right">
            {label && !showLabelInput && (
              <div className="mb-6 flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.65_0.25_151)]/10 border border-[oklch(0.65_0.25_151)]/30 rounded-lg">
                  <Tag className="w-4 h-4 text-[oklch(0.65_0.25_151)]" />
                  <span className="text-foreground font-medium">{label}</span>
                </div>
              <button
                onClick={handleEditLabel}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit label"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRemoveLabel}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remove label"
              >
                  <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showLabelInput && (
              <div className="mb-6 flex items-center gap-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Enter a label or note for this address..."
                  className="input flex-1 max-w-md"
                onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
                autoFocus
              />
                <button onClick={handleSaveLabel} className="btn btn-primary">
                Save
              </button>
              <button
                onClick={() => {
                  setShowLabelInput(false);
                  setLabelInput("");
                }}
                  className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          )}

          {!label && !showLabelInput && (
            <div className="mb-6">
              <button
                onClick={() => setShowLabelInput(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors text-sm"
              >
                <Tag className="w-4 h-4" /> Add label
              </button>
            </div>
          )}
          </div>

          <Tabs tabs={tabs} defaultTab="overview" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
