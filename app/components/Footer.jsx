import { useBlockchain } from "../App"

export default function Footer() {
  const { rpcUrl } = useBlockchain()

  return (
    <footer className="border-t border-[oklch(0.65_0.25_151)]/20 mt-16 bg-card/30">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 <span className="text-[oklch(0.65_0.25_151)] font-medium">ChainExplorer</span>. Connected to {rpcUrl}
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors">
              API
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
