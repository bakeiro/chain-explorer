import { createContext, useContext, useEffect } from "react"
import { useLocalStorage } from "../hooks/useLocalStorage"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage("theme", "dark")

  useEffect(() => {
    // Apply theme class to html element
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const isDark = theme === "dark"

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
