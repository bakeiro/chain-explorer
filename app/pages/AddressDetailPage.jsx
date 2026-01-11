import { useEffect, useState, useMemo } from "react";
import { useBlockchain, useRouter } from "../App";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Skeleton from "../components/Skeleton";
import Tabs from "../components/Tabs";
import CodeContent from "../components/TabAddressContractCode"
import TransactionsContent from "../components/TabAddressTransactions";
import { fetchAddressByAddress, fetchAddressTransactions } from "../lib/BlockchainApi";
import { Bookmark, BookmarkCheck, Copy, Edit2, FileCode, Tag, Wallet, X } from "lucide-react";

export default function AddressDetailPage({ address }) {
  const [addressData, setAddressData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);

  const { rpcUrl, getContractABI, getAddressLabel, saveAddressLabel, removeAddressLabel, isAddressSaved, saveAddress, unsaveAddress } = useBlockchain();
  const { navigate } = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [parsedABI, setParsedABI] = useState(null);  
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

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewContent /> },
    { id: "transactions", label: "Transactions", content: <TransactionsContent address={address} /> },
    ...(addressData?.isContract ? [{ id: "code", label: "Code", content: <CodeContent address={address} addressData={addressData} /> }] : []),
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

            <div className="flex">
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
                className={`text-foreground border btn ml-2 px-2 py-3 ${isSaved ? "bg-[oklch(0.65_0.25_151)]/10 border-[oklch(0.65_0.25_151)]/30 text-[oklch(0.65_0.25_151)]" : "bg-muted"} flex items-center gap-2`}
              >
                {isSaved
                  ? (<BookmarkCheck className="w-5 h-5 text-[oklch(0.65_0.25_151)]" />)
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
                className="btn btn-outline"
                onClick={() => {
                  setShowLabelInput(false);
                  setLabelInput("");
                }}
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
