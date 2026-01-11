import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, Filter, RefreshCw } from "lucide-react";
import Skeleton from "./Skeleton";
import {
  extractFunctionSelector,
  findMatchingFunction,
} from "../lib/AbiDecoder";
import { fetchAddressTransactions } from "../lib/BlockchainApi";
import { useBlockchain, useRouter } from "../App";
import DecodedTransactionInput from "./DecodedTransactionInput";

const TRANSACTIONS_PER_PAGE = 20;

export default function AddressTransactions({
  address,
}) {
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const [methodFilter, setMethodFilter] = useState("all");
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  // const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  const {
    rpcUrl,
    getContractABI,
    getAddressLabel,
  } = useBlockchain();
  const { navigate } = useRouter();
  const [parsedABI, setParsedABI] = useState(null);

  const loadTransactions = async () => {
    if (!rpcUrl || !address) return;
    try {
      const data = await fetchAddressTransactions(rpcUrl, address);
      setTransactions(data?.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  useEffect(() => {
    const savedABI = getContractABI(address);
    if (savedABI) {
      setParsedABI(savedABI);
    }
    const savedLabel = getAddressLabel(address);
    if (savedLabel) {
      // setLabel(savedLabel); // TODO: for what?
    }
  }, [address, getContractABI, getAddressLabel]);

  useEffect(() => {
    loadTransactions();
  }, [rpcUrl, address]);

  const uniqueMethods = useMemo(() => {
    const methods = new Map();

    if (!transactions.forEach) {
      debugger;
      console.log(transactions)
    }

    transactions?.forEach((tx) => {
      if (!tx.input || tx.input === "0x") {
        methods.set("transfer", {
          name: "Transfer (Native)",
          selector: "transfer",
        });
        return;
      }

      const selector = extractFunctionSelector(tx.input);
      if (!selector) return;

      // Intentar obtener el nombre del método desde el ABI del contrato destino
      const contractABI = tx.to ? getContractABI(tx.to) : null;
      const matchingFunction = contractABI
        ? findMatchingFunction(contractABI, selector)
        : null;

      if (matchingFunction) {
        methods.set(selector, { name: matchingFunction.name, selector });
      } else {
        methods.set(selector, { name: selector, selector });
      }
    });

    return Array.from(methods.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [transactions, getContractABI]);

  const filteredTransactions = useMemo(() => {
    if (methodFilter === "all") return transactions;

    return transactions.filter((tx) => {
      if (methodFilter === "transfer") {
        return !tx.input || tx.input === "0x";
      }

      const selector = extractFunctionSelector(tx.input);
      return selector === methodFilter;
    });
  }, [transactions, methodFilter]);

  const handleExportTransactions = () => {
    const dataToExport = filteredTransactions.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      input: tx.input,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      status: tx.status,
    }));

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const methodName = methodFilter === "all"
      ? "all"
      : getCurrentMethodName().replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `transactions_${address.slice(0, 8)}_${methodName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefreshTransactions = () => {
    setIsLoadingTxs(true);
    queryClient.invalidateQueries({ queryKey: ["rpc", rpcUrl] });
    loadTransactions();
  };

  const getCurrentMethodName = () => {
    if (methodFilter === "all") return "All Methods";
    const method = uniqueMethods.find((m) => m.selector === methodFilter);
    return method ? method.name : methodFilter;
  };

  return (
    <div className="card">
      <div className="card-header w-[100%]">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-lg">Transaction History</h3>
          <div className="flex">
            <div className="relative">
              <button
                onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                className="btn btn-outline btn-sm flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span className="max-w-[150px] truncate">
                  {getCurrentMethodName()}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showMethodDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMethodDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMethodDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setMethodFilter("all");
                        setShowMethodDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                        methodFilter === "all"
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      All Methods
                    </button>
                    <div className="border-t border-border" />
                    {uniqueMethods.map((method) => (
                      <button
                        key={method.selector}
                        onClick={() => {
                          setMethodFilter(method.selector);
                          setShowMethodDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                          methodFilter === method.selector
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="block truncate">{method.name}</span>
                        {method.name !== method.selector && (
                          <span className="text-xs text-muted-foreground/70">
                            {method.selector}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleExportTransactions}
              disabled={filteredTransactions.length === 0}
              className="btn btn-outline btn-sm ml-4"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>

            <button
              onClick={handleRefreshTransactions}
              disabled={isLoadingTxs}
              className="ml-4 btn btn-outline btn-sm"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoadingTxs ? "animate-spin" : ""}`}
              />
              {isLoadingTxs ? "Loading" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
      <div className="card-content">
        {isLoadingTxs && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoadingTxs &&
          (!filteredTransactions || filteredTransactions.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}

        {!isLoadingTxs &&
          (filteredTransactions && filteredTransactions.length > 0) && (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
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
}
