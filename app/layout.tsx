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
import CommandPalette from '@/components/CommandPalette'
import ProjectModalManager from '@/components/ProjectModalManager'
import { 
  Menu, 
  ChevronRight,
  Search,
  Plus,
  Cloud,
  Check,
  PlusCircle,
  Ticket,
  FolderPlus,
  UserPlus
} from 'lucide-react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [orgName, setOrgName] = useState<string>('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  
  // Safely extract orgId: if it's a known top-level static route, orgId is undefined.
  const firstSegment = pathname.split('/')[1]
  const isStaticRoute = ['login', 'register', 'onboarding', 'new', 'auth', 'settings'].includes(firstSegment || '')
  const orgId = isStaticRoute ? undefined : firstSegment

  const supabase = createClient()

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
    }
    getUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          // Fetch profile data without blocking the callback
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => setProfile(data))
        } else {
          setProfile(null)
        }
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
          {user && pathname !== '/login' && pathname !== '/register' && pathname !== '/onboarding' ? (
          <>
            {/* Mobile Drawer Backdrop */}
            {isDrawerOpen && (
              <div 
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setIsDrawerOpen(false)}
              />
            )}

            {/* Sidebar / Drawer */}
            <aside 
              className={`
                fixed inset-y-0 left-0 z-50 bg-card border-r border-border transition-[width] duration-200 ease-in-out group
                lg:w-[60px] lg:hover:w-[240px]
                ${isDrawerOpen ? 'w-[240px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'}
              `}
            >
              <Sidebar orgName={orgName} setIsDrawerOpen={setIsDrawerOpen} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-[60px]">
              {/* Top Header */}
              <header className="h-[52px] border-b border-border flex items-center justify-between px-4 md:px-6 bg-background z-30 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-1.5 -ml-1.5 text-muted hover:text-foreground lg:hidden rounded-md transition-colors"
                  >
                    <Menu size={20} />
                  </button>
                  <div className="flex items-center gap-2 text-muted text-sm font-medium whitespace-nowrap">
                    <OrganizationSelector />
                    <ChevronRight size={14} className="opacity-50 shrink-0" />
                    <span className="text-foreground font-semibold capitalize truncate max-w-[80px] md:max-w-[200px]">
                      {pathname.includes('/projects/') 
                        ? pathname.split('/')[4] || 'Overview' 
                        : pathname.split('/')[2] || 'Dashboard'}
                    </span>
                  </div>
                </div>

                {/* Global Command Palette Trigger */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                  <button 
                    onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                    className="w-full flex items-center gap-3 px-3 h-8 bg-accent/30 hover:bg-accent/50 border border-border rounded-lg text-muted-foreground transition-all group"
                  >
                    <Search size={14} strokeWidth={2} className="group-hover:text-foreground transition-colors" />
                    <span className="text-xs font-medium">Search project, tickets...</span>
                    <kbd className="ml-auto text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground/60 font-mono">⌘K</kbd>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sync Status Indicator */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent/30 transition-colors cursor-default group" title="System Live & Synced">
                    <div className="relative">
                      <Cloud size={14} className="text-primary/70" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-background" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:block">Synced</span>
                  </div>

                  <div className="w-px h-4 bg-border/60 hidden sm:block" />

                  <div className="flex items-center gap-1.5">
                    {/* Quick Action Button */}
                    <div className="relative">
                      <button 
                        onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                        className={`p-1.5 rounded-md transition-all ${isQuickActionOpen ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground hover:bg-accent'}`}
                      >
                        <Plus size={18} />
                      </button>

                      {isQuickActionOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsQuickActionOpen(false)} />
                          <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-3 py-2 border-b border-border mb-1">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quick Actions</p>
                            </div>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all group">
                              <Ticket size={14} className="text-primary group-hover:scale-110 transition-transform" /> New Ticket
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all group">
                              <FolderPlus size={14} className="text-primary group-hover:scale-110 transition-transform" /> New Project
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all group">
                              <UserPlus size={14} className="text-primary group-hover:scale-110 transition-transform" /> Invite Member
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <NotificationCenter />
                    <ThemeToggle />
                  </div>
                  
                  <div className="w-px h-5 bg-border/60 hidden sm:block" />
                  
                  {/* User Avatar with Profile Image */}
                  <div className="relative group cursor-pointer">
                    <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-purple-500/10 flex items-center justify-center transition-all group-hover:border-primary/50 group-hover:ring-4 group-hover:ring-primary/10">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-purple-500">
                          {user.email?.[0].toUpperCase()}
                        </span>
                      )}
                    </div>
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
            {(pathname === '/login' || pathname === '/register' || pathname === '/onboarding') ? children : null}
          </main>
          )}
          <CommandPalette />
          <ProjectModalManager />
          </Providers>
          </body>
          </html>
          )
          }