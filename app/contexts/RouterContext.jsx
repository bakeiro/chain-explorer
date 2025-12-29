import { createContext, useContext, useState, useCallback, useMemo } from "react"

const RouterContext = createContext(null)

// Page hierarchy for back navigation
const PAGE_HIERARCHY = {
  "block-detail": "blocks",
  "transaction-detail": "transactions",
  "address-detail": "addresses",
}

export function RouterProvider({ children }) {
  const [currentPage, setCurrentPage] = useState("home")
  const [pageParams, setPageParams] = useState({})

  const navigate = useCallback((page, params = {}) => {
    setCurrentPage(page)
    setPageParams(params)
  }, [])

  const goBack = useCallback(() => {
    const parentPage = PAGE_HIERARCHY[currentPage] ?? "home"
    navigate(parentPage)
  }, [currentPage, navigate])

  const value = useMemo(
    () => ({
      currentPage,
      pageParams,
      navigate,
      goBack,
    }),
    [currentPage, pageParams, navigate, goBack],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error("useRouter must be used within RouterProvider")
  }
  return context
}
