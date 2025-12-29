'use client'

import { useState, useEffect } from 'react'

// ============== CONFIGURAZIONE LINK ==============
const X_ACCOUNT_URL = 'https://x.com/TUO_ACCOUNT'  // Cambia con il tuo X
const DEXSCREENER_URL = 'https://dexscreener.com/solana/TUO_TOKEN'  // Cambia con il tuo chart
const CONTRACT_ADDRESS = 'INSERISCI_IL_TUO_CONTRACT_ADDRESS'  // Il tuo token
const BUYING_TOKEN_ADDRESS = 'a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump'  // Token che compri

// ============== ICONE ==============
const LightningIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
)

const DolphinIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-1.1-.9-2-2-2h-2c0-1.65-1.35-3-3-3s-3 1.35-3 3H8l-4-4v10l4-4h4c0 1.65 1.35 3 3 3s3-1.35 3-3h2c1.1 0 2-.9 2-2zm-7-1c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
  </svg>
)

const XIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const DexScreenerIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalBuys: 0,
    lastBuyAmount: 0,
  })
  
  const [buyHistory, setBuyHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setBuyHistory(data.history)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatSOL = (amount) => {
    return parseFloat(amount).toFixed(4)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const shortenAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <main className="relative z-10 min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-neon-cyan animate-float">
            <DolphinIcon />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-wider">
            <span className="text-white">DOLPHIN</span>
            <span className="text-neon-green glow-text ml-3">BUYBACK</span>
          </h1>
          <div className="text-neon-green">
            <LightningIcon />
          </div>
        </div>
        <p className="text-gray-400 font-body text-lg tracking-wide">
          Automated fee collection & token buybacks via Jupiter
        </p>
        {lastUpdate && (
          <p className="text-gray-500 text-sm mt-2">
            Last update: {formatTime(lastUpdate)}
          </p>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {/* Total Volume */}
        <div className="cyber-card p-6 text-center hover:shadow-neon transition-shadow duration-300">
          <div className="text-gray-400 font-body text-sm uppercase tracking-widest mb-2">
            Total Volume
          </div>
          <div className="font-display text-4xl md:text-5xl font-bold text-neon-green glow-text stat-number">
            {loading ? '...' : formatSOL(stats.totalVolume)}
          </div>
          <div className="text-neon-cyan text-lg font-body mt-1">SOL</div>
        </div>

        {/* Total Buys */}
        <div className="cyber-card p-6 text-center hover:shadow-cyan transition-shadow duration-300">
          <div className="text-gray-400 font-body text-sm uppercase tracking-widest mb-2">
            Total Buys
          </div>
          <div className="font-display text-4xl md:text-5xl font-bold text-neon-cyan glow-cyan stat-number">
            {loading ? '...' : stats.totalBuys}
          </div>
          <div className="text-gray-400 text-lg font-body mt-1">transactions</div>
        </div>

        {/* Last Buy */}
        <div className="cyber-card p-6 text-center hover:shadow-neon transition-shadow duration-300">
          <div className="text-gray-400 font-body text-sm uppercase tracking-widest mb-2">
            Last Buy
          </div>
          <div className="font-display text-4xl md:text-5xl font-bold text-white stat-number">
            {loading ? '...' : formatSOL(stats.lastBuyAmount)}
          </div>
          <div className="text-neon-green text-lg font-body mt-1">SOL</div>
        </div>
      </div>

      {/* Buy History */}
      <div className="max-w-5xl mx-auto">
        <div className="cyber-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-neon-green">
              <LightningIcon />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wide">
              RECENT BUYBACKS
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Loading transactions...</p>
            </div>
          ) : buyHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No buybacks yet. Waiting for fees...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 text-gray-500 text-sm font-body uppercase tracking-wider pb-3 border-b border-card-border">
                <div>Time</div>
                <div>Amount</div>
                <div>TX Hash</div>
                <div className="text-right">Status</div>
              </div>

              {/* Rows */}
              {buyHistory.map((buy, index) => (
                <div 
                  key={buy.signature || index}
                  className="buy-row grid grid-cols-4 gap-4 items-center py-3 border-b border-card-border/50 hover:bg-white/5 transition-colors rounded"
                >
                  <div className="text-gray-300 font-body">
                    {formatTime(buy.timestamp)}
                  </div>
                  <div className="font-display font-bold text-neon-green">
                    {formatSOL(buy.amount)} SOL
                  </div>
                  <div>
                    <a 
                      href={`https://solscan.io/tx/${buy.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon-cyan hover:underline font-mono text-sm"
                    >
                      {shortenAddress(buy.signature)}
                    </a>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-neon-green/20 text-neon-green rounded text-sm font-body">
                      <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                      Success
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12">
        {/* Contract Address */}
        <p className="text-gray-500 text-sm mb-2">
          Contract Address: <code className="text-neon-green bg-card-bg px-2 py-1 rounded">{CONTRACT_ADDRESS}</code>
        </p>
        
        {/* Buying Token Address */}
        <p className="text-gray-500 text-sm mb-4">
          Buying Token: <code className="text-neon-cyan bg-card-bg px-2 py-1 rounded">{BUYING_TOKEN_ADDRESS}</code>
        </p>
        
        {/* Social Links */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <a 
            href={X_ACCOUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200 hover:scale-110 transform"
            title="Follow us on X"
          >
            <XIcon />
          </a>
          <a 
            href={DEXSCREENER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-neon-green transition-colors duration-200 hover:scale-110 transform"
            title="View Chart on DexScreener"
          >
            <DexScreenerIcon />
          </a>
        </div>
        
        {/* Powered by */}
        <p className="text-gray-500 text-sm">
          Powered by Solana
        </p>
      </footer>
    </main>
  )
}
