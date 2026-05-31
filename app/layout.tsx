"use client"

import './globals.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LogoutButton from '@/components/LogoutButton'
import { 
  LayoutDashboard, 
  Ticket, 
  Calendar, 
  Users, 
  Menu, 
  X, 
  Zap,
  Settings,
  ChevronRight
} from 'lucide-react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Tickets', href: '/tickets', icon: Ticket },
    { label: 'Sprints', href: '/sprints', icon: Zap },
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
  ]

  const SidebarItem = ({ item, collapsed = false }: { item: any, collapsed?: boolean }) => {
    const isActive = pathname === item.href
    return (
      <Link 
        href={item.href}
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors min-h-[44px] md:min-h-[36px] ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-500 border-l-2 border-emerald-500 rounded-l-none' 
            : 'text-muted hover:text-foreground hover:bg-accent'
        }`}
      >
        <item.icon size={isActive ? 20 : 18} strokeWidth={1.5} />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    )
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground font-sans antialiased overflow-hidden flex h-screen">
        {user && pathname !== '/login' && pathname !== '/register' ? (
          <>
            {/* Mobile Drawer Backdrop */}
            {isDrawerOpen && (
              <div 
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setIsDrawerOpen(false)}
              />
            )}

            {/* Sidebar / Drawer */}
            <aside className={`
              fixed inset-y-0 left-0 z-50 w-[240px] bg-card border-r border-border transform transition-transform duration-200 ease-in-out
              lg:translate-x-0 lg:static lg:block
              ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
              ${/* Tablet state: hidden on tablet, we'll handle the icon-only sidebar separately if needed, but for simplicity let's stick to full on lg */ ''}
              lg:w-[240px] md:w-[64px] lg:flex-shrink-0
            `}>
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="h-[52px] flex items-center px-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                      <Zap size={14} className="text-black fill-current" />
                    </div>
                    <span className="font-bold tracking-tight text-foreground md:hidden lg:block">GEKKO</span>
                  </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                  {navItems.map(item => (
                    <div key={item.href}>
                      <div className="hidden lg:block">
                        <SidebarItem item={item} />
                      </div>
                      <div className="hidden md:block lg:hidden">
                        <SidebarItem item={item} collapsed />
                      </div>
                      <div className="md:hidden">
                        <SidebarItem item={item} />
                      </div>
                    </div>
                  ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border flex flex-col gap-1">
                  <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-muted hover:text-foreground transition-colors md:justify-center lg:justify-start">
                    <Settings size={18} />
                    <span className="text-sm font-medium md:hidden lg:block">Settings</span>
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top Header */}
              <header className="h-[48px] md:h-[52px] border-b border-border flex items-center justify-between px-4 bg-background z-30">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-2 -ml-2 text-muted hover:text-foreground lg:hidden"
                  >
                    <Menu size={20} />
                  </button>
                  <div className="flex items-center gap-2 text-muted text-xs md:text-sm font-medium">
                    <span className="hover:text-foreground cursor-pointer transition-colors">Workspace</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground capitalize">{pathname.split('/')[1] || 'Dashboard'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:block">
                    <LogoutButton />
                  </div>
                  <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-xs font-bold text-emerald-500">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </div>
              </header>

              {/* Page Content */}
              <div className="flex-1 overflow-auto bg-background p-4 md:p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto w-full">
                  {children}
                </div>
              </div>
            </main>
          </>
        ) : (
          <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-background w-full h-screen">
            {(pathname === '/login' || pathname === '/register') ? children : null}
          </main>
        )}
      </body>
    </html>
  )
}