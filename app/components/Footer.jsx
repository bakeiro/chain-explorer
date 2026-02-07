import { useBlockchain } from "../App";

export default function Footer() {
  const { rpcUrl } = useBlockchain();

  return (
    <footer className="border-t border-[oklch(0.65_0.25_151)]/20 mt-16 bg-card/30">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026{" "}
            <span className="text-[oklch(0.65_0.25_151)] font-medium">
              ChainExplorer
            </span>. Connected to {rpcUrl}
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors"
            >
              API
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-[oklch(0.65_0.25_151)] transition-colors"
            >
              Support
            </a>
          </div>
        </div>

        <div className="inline-flex flex-col mt-4 gap-2 bg-[#1a1a1a] rounded-xl px-3 py-3 border border-[#2a2a2a]">
          <a target="_blank" href="https://poolmaster.io/">
            <div className="flex items-center gap-1">
              <span className="text-[#009966] text-sm font-semibold tracking-wide hover:underline cursor-pointer transition-all">
                Sponsored by
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Pool icon */}
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="14" width="16" height="4" fill="#10B981"></rect>
                <ellipse
                  cx="12"
                  cy="14"
                  rx="8"
                  ry="3"
                  fill="#10B981"
                  stroke="#10B981"
                  strokeWidth="1.5"
                >
                </ellipse>
                <path
                  d="M 4 18 A 8 3 0 0 0 20 18"
                  fill="#10B981"
                  stroke="#10B981"
                  strokeWidth="1.5"
                >
                </path>
                <line
                  x1="4"
                  y1="14"
                  x2="4"
                  y2="18"
                  stroke="#10B981"
                  strokeWidth="1.5"
                >
                </line>
                <line
                  x1="20"
                  y1="14"
                  x2="20"
                  y2="18"
                  stroke="#10B981"
                  strokeWidth="1.5"
                >
                </line>
                <path
                  d="M 4 6 A 8 3 0 0 1 20 6"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                >
                </path>
                <path
                  d="M 4 18 A 8 3 0 0 0 20 18"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                >
                </path>
                <line
                  x1="4"
                  y1="6"
                  x2="4"
                  y2="18"
                  stroke="white"
                  strokeWidth="1.5"
                >
                </line>
                <line
                  x1="20"
                  y1="6"
                  x2="20"
                  y2="18"
                  stroke="white"
                  strokeWidth="1.5"
                >
                </line>
              </svg>
              <span className="text-white text-lg font-bold tracking-tight">
                PoolMaster
              </span>
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
}
