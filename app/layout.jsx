import './globals.css'

export const metadata = {
  title: 'Dolphin Buyback Dashboard',
  description: 'Real-time buyback tracker powered by Jupiter',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="cyber-grid min-h-screen">
        <div className="lightning-bg" />
        {children}
      </body>
    </html>
  )
}
