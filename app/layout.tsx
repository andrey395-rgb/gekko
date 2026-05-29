import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
export const metadata: Metadata = {
  title: 'Gekko | Developer Home Base',
  description: 'Project management for dev teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-50 text-gray-900">
        {/* Left Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <span className="text-xl font-bold tracking-widest text-emerald-400">GEKKO</span>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <a href="/dashboard" className="p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-400">Dashboard</a>
            <Link href="/tickets" className="p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-400">Tickets</Link>
            <a href="/sprints" className="p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-400">Sprints</a>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
            <div className="font-semibold text-gray-600">Workspace</div>
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div> {/* Placeholder Avatar */}
          </header>

          {/* Dynamic Page Content */}
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}