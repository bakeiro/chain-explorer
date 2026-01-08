import "../main.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useRpcQuery";

// Pages
import HomePage from "./pages/HomePage";
import TransactionsPage from "./pages/TransactionsPage";
import BlocksPage from "./pages/BlocksPage";
import AddressesPage from "./pages/AddressesPage";
import BlockDetailPage from "./pages/BlockDetailPage";
import TransactionDetailPage from "./pages/TransactionDetailPage";
import AddressDetailPage from "./pages/AddressDetailPage";

// Components
import RpcConnector from "./components/RpcConnector";

// Contexts
import { RouterProvider, useRouter } from "./contexts/RouterContext";
import { BlockchainProvider, useBlockchain } from "./contexts/BlockchainContext";

// Re-export hooks for external use
export { useRouter } from "./contexts/RouterContext";
export { useBlockchain } from "./contexts/BlockchainContext";

// Page component mapping
const PAGES = {
  home: HomePage,
  transactions: TransactionsPage,
  blocks: BlocksPage,
  addresses: AddressesPage,
  "block-detail": BlockDetailPage,
  "transaction-detail": TransactionDetailPage,
  "address-detail": AddressDetailPage,
};

// Props mapping for detail pages
const getPageProps = (page, params) => {
  const propsMap = {
    "block-detail": { blockNumber: params.blockNumber },
    "transaction-detail": { hash: params.hash },
    "address-detail": { address: params.address },
  };
  return propsMap[page] ?? {};
};

function AppContent() {
  const { rpcUrl, isConnected } = useBlockchain();
  const { currentPage, pageParams } = useRouter();

  if (!isConnected) {
    return (
      <div className="dark min-h-screen bg-background">
        <RpcConnector />
      </div>
    );
  }

  const PageComponent = PAGES[currentPage] ?? HomePage;
  const pageProps = getPageProps(currentPage, pageParams);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <PageComponent {...pageProps} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlockchainProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </BlockchainProvider>
    </QueryClientProvider>
  );
}

export default App;
