import { Tag } from "lucide-react"
import { useBlockchain } from "../App"

/**
 * Displays an address with its saved label (if exists)
 * @param {string} address - The blockchain address
 * @param {boolean} truncate - Whether to truncate the address display
 * @param {string} className - Additional classes for the address text
 */
export default function AddressWithLabel({ address, truncate = false, className = "" }) {
  const { getAddressLabel } = useBlockchain()

  if (!address) return null

  const label = getAddressLabel(address)
  const displayAddress = truncate ? `${address.slice(0, 10)}...${address.slice(-8)}` : address

  function handleOnClick() {
    alert("navigate here :D")
  }

  return (
    <span onClick={handleOnClick} className="inline-flex items-center gap-2 flex-wrap">
      {label && (
        <span className="inline-flex items-center gap-1 text-xs bg-[oklch(0.65_0.25_151)]/10 text-[oklch(0.65_0.25_151)] px-1.5 py-0.5 rounded">
          {label && (<> <Tag className="w-3 h-3" /> {label} </>)}
        </span>
      )}
      <code className={`text-sm text-[oklch(0.65_0.25_151)] font-mono hover:underline font-mono cursor-pointer ${className}`}>{displayAddress}</code>
    </span>
  )
}
