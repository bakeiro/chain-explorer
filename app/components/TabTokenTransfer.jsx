import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Coins, Download, Filter, RefreshCw } from "lucide-react";
import { fetchERC20Transfers } from "../lib/BlockchainApi";
import { useEffect, useMemo, useState } from "react";
import { BLOCKCHAIN_CONFIG } from "../lib/Constants";
import AddressWithLabel from "./AddressWithLabel";
import { useBlockchain, useRouter } from "../App";
import Skeleton from "./Skeleton";

const TRANSFERS_PER_PAGE = 20;

export default function TokenTransfersContent({ address }) {
    const [transfers, setTransfers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tokenFilter, setTokenFilter] = useState("all");
    const [showTokenDropdown, setShowTokenDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const { rpcUrl, getAddressLabel } = useBlockchain();
    const { navigate } = useRouter();

    const loadTransfers = async () => {
        if (!rpcUrl || !address) return;
        try {
            const data = await fetchERC20Transfers(rpcUrl, address);
            setTransfers(data?.transfers || []);
        } catch (error) {
            console.error("Error fetching token transfers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTransfers();
    }, [rpcUrl, address]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tokenFilter]);

    const uniqueTokens = useMemo(() => {
        const tokens = new Map();

        transfers.forEach((transfer) => {
            const tokenAddress = transfer.tokenAddress?.toLowerCase();
            if (!tokenAddress) return;

            if (!tokens.has(tokenAddress)) {
                const label = getAddressLabel(tokenAddress);
                tokens.set(tokenAddress, {
                    address: transfer.tokenAddress,
                    label: label ||
                        `${transfer.tokenAddress.slice(0, 8)}...${
                            transfer.tokenAddress.slice(-6)
                        }`,
                    count: 1,
                });
            } else {
                tokens.get(tokenAddress).count++;
            }
        });

        return Array.from(tokens.values()).sort((a, b) => b.count - a.count);
    }, [transfers, getAddressLabel]);

    const filteredTransfers = useMemo(() => {
        if (tokenFilter === "all") return transfers;

        return transfers.filter((transfer) =>
            transfer.tokenAddress?.toLowerCase() === tokenFilter.toLowerCase()
        );
    }, [transfers, tokenFilter]);

    const totalPages = Math.ceil(filteredTransfers.length / TRANSFERS_PER_PAGE);
    const startIndex = (currentPage - 1) * TRANSFERS_PER_PAGE;
    const endIndex = startIndex + TRANSFERS_PER_PAGE;
    const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

    const handleExportTransfers = () => {
        const totalToExport = filteredTransfers.length;

        if (totalToExport > BLOCKCHAIN_CONFIG.TX_EXPORT_WARNING_THRESHOLD) {
            const proceed = window.confirm(
                `You are about to export ${totalToExport.toLocaleString()} token transfers. This may create a large file and take some time. Continue?`,
            );
            if (!proceed) return;
        }

        const dataToExport = filteredTransfers.map((t) => ({
            hash: t.hash,
            logIndex: t.logIndex,
            blockNumber: t.blockNumber,
            tokenAddress: t.tokenAddress,
            from: t.from,
            to: t.to,
            value: t.value,
            formattedValue: t.formattedValue,
            type: t.type,
            timestamp: t.timestamp,
        }));

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const tokenName = tokenFilter === "all"
            ? "all_tokens"
            : tokenFilter.slice(0, 8);
        link.download = `token_transfers_${
            address.slice(0, 8)
        }_${tokenName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setCurrentPage(1);
        loadTransfers();
    };

    const getCurrentTokenName = () => {
        if (tokenFilter === "all") return "All Tokens";
        const token = uniqueTokens.find((t) =>
            t.address.toLowerCase() === tokenFilter.toLowerCase()
        );
        return token ? token.label : tokenFilter.slice(0, 10) + "...";
    };

    return (
        <div className="card">
            <div className="card-header w-[100%]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="card-title text-lg">Token Transfers</h3>
                        <span className="text-sm text-muted-foreground">
                            ({filteredTransfers.length.toLocaleString()}{" "}
                            transfers)
                        </span>
                    </div>
                    <div className="flex">
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowTokenDropdown(!showTokenDropdown)}
                                className="btn btn-outline btn-sm flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                <span className="max-w-[150px] truncate">
                                    {getCurrentTokenName()}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                        showTokenDropdown ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {showTokenDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() =>
                                            setShowTokenDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                setTokenFilter("all");
                                                setShowTokenDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                                                tokenFilter === "all"
                                                    ? "bg-muted text-foreground font-medium"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            All Tokens
                                        </button>
                                        <div className="border-t border-border" />
                                        {uniqueTokens.map((token) => (
                                            <button
                                                key={token.address}
                                                onClick={() => {
                                                    setTokenFilter(
                                                        token.address,
                                                    );
                                                    setShowTokenDropdown(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                                                    tokenFilter
                                                            .toLowerCase() ===
                                                            token.address
                                                                .toLowerCase()
                                                        ? "bg-muted text-foreground font-medium"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="truncate">
                                                        {token.label}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground/70 ml-2">
                                                        ({token.count})
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleExportTransfers}
                            disabled={filteredTransfers.length === 0}
                            className="btn btn-outline btn-sm ml-4"
                        >
                            <Download className="w-4 h-4 mr-2" /> Export
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="ml-4 btn btn-outline btn-sm"
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${
                                    isLoading ? "animate-spin" : ""
                                }`}
                            />
                            {isLoading ? "Loading" : "Refresh"}
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-content">
                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                )}

                {!isLoading &&
                    (!filteredTransfers || filteredTransfers.length === 0) && (
                    <div className="text-center py-8">
                        <Coins className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                            No token transfers found
                        </p>
                    </div>
                )}

                {!isLoading && filteredTransfers &&
                    filteredTransfers.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {paginatedTransfers.map((transfer, index) => (
                                <div
                                    key={`${transfer.hash}-${transfer.logIndex}-${index}`}
                                    onClick={() =>
                                        navigate("transaction-detail", {
                                            hash: transfer.hash,
                                        })}
                                    className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`badge ${
                                                        transfer.type === "send"
                                                            ? "badge-destructive"
                                                            : "badge-default"
                                                    }`}
                                                >
                                                    {transfer.type === "send"
                                                        ? (
                                                            <>
                                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                                OUT
                                                            </>
                                                        )
                                                        : (
                                                            <>
                                                                <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                                IN
                                                            </>
                                                        )}
                                                </span>
                                                <code className="text-sm text-muted-foreground truncate">
                                                    {transfer.hash}
                                                </code>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Token:
                                                    </span>
                                                    <AddressWithLabel
                                                        address={transfer
                                                            .tokenAddress}
                                                        truncate
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        From:
                                                    </span>
                                                    <AddressWithLabel
                                                        address={transfer.from}
                                                        truncate
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        To:
                                                    </span>
                                                    <AddressWithLabel
                                                        address={transfer.to}
                                                        truncate
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-semibold">
                                                {transfer.formattedValue}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {transfer.timeAgo}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} -{" "}
                                    {Math.min(
                                        endIndex,
                                        filteredTransfers.length,
                                    )} of{" "}
                                    {filteredTransfers.length.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="btn btn-outline btn-sm"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1)
                                            )}
                                        disabled={currentPage === 1}
                                        className="btn btn-outline btn-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm px-3">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-outline btn-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-outline btn-sm"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
