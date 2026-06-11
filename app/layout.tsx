"use client"

import './globals.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LogoutButton from '@/components/LogoutButton'
import { Providers } from '@/components/Providers'
import { ThemeToggle } from '@/components/ThemeToggle'
import OrganizationSelector from '@/components/OrganizationSelector'
import NotificationCenter from '@/components/NotificationCenter'
import Sidebar from '@/components/Sidebar'
import { 
  Menu, 
  ChevronRight
} from 'lucide-react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [orgName, setOrgName] = useState<string>('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const orgId = params?.orgId as string | undefined
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

  // Fetch current org name for breadcrumbs
  useEffect(() => {
    if (orgId) {
      const fetchOrgName = async () => {
        const { data } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single()
        if (data) setOrgName(data.name)
      }
      fetchOrgName()
    } else {
      setOrgName('')
    }
  }, [orgId, supabase])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased overflow-hidden flex h-screen">
        <Providers>
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
              lg:w-[240px] md:w-[240px] lg:flex-shrink-0
            `}>
              <Sidebar orgName={orgName} setIsDrawerOpen={setIsDrawerOpen} />
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
                  <div className="flex items-center gap-3 text-muted text-xs md:text-sm font-medium">
                    <OrganizationSelector />
                    <ChevronRight size={14} className="opacity-50 shrink-0" />
                    <span className="text-foreground capitalize truncate max-w-[150px]">
                      {pathname.includes('/projects/') 
                        ? pathname.split('/')[4] || 'Overview' 
                        : pathname.split('/')[2] || 'Dashboard'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <NotificationCenter />
                  <div className="w-px h-4 bg-border/50 mx-1 hidden sm:block" />
                  <ThemeToggle />
                  <div className="hidden sm:block">
                    <LogoutButton />
                  </div>
                  <div className="w-7 h-7 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-purple-500 shrink-0">
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
          </Providers>
          </body>
          </html>
          )
          }