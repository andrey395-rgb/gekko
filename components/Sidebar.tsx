"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutDashboard, 
  Ticket, 
  Zap, 
  Users, 
  Settings,
  Search,
  FolderOpen,
  Plus,
  Calendar,
  Layers,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import { GeckoLogo } from './GeckoLogo'

export default function Sidebar({ orgName, setIsDrawerOpen }: { orgName: string, setIsDrawerOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const orgId = params?.orgId as string | undefined
  const projectId = params?.projectId as string | undefined
  const supabase = createClient()

  const [projects, setProjects] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    if (orgId) {
      const fetchProjects = async () => {
        setLoading(true)
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true })
        
        if (data) setProjects(data)
        setLoading(false)
      }
      fetchProjects()
    }
  }, [orgId, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavItem = ({ label, href, icon: Icon, active }: any) => (
    <div className="relative group/item">
      <Link 
        href={href}
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center h-10 gap-3 px-3 rounded-md transition-all ${
          active 
            ? 'bg-purple-500/10 text-purple-500 font-semibold' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        <div className="flex-shrink-0 w-5 flex justify-center">
          <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-purple-500' : 'text-muted-foreground/70 group-hover/item:text-foreground'} />
        </div>
        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[160px]`}>
          {label}
        </span>
      </Link>
      
      {/* Tooltip (only on desktop and when not expanded) */}
      <div className="absolute left-full ml-4 px-2 py-1 bg-popover border border-border rounded text-[10px] font-bold text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 lg:group-hover:hidden transition-opacity z-[60] shadow-xl uppercase tracking-widest hidden lg:block">
        {label}
      </div>
    </div>
  )

  const handleCreateProject = async () => {
    if (!orgId) return
    const name = prompt('Project Name:')
    if (!name) return

    const { data, error } = await supabase
      .from('projects')
      .insert([{ organization_id: orgId, name }])
      .select()
      .single()
    
    if (data) {
      setProjects([...projects, data])
      router.push(`/${orgId}/projects/${data.id}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Sidebar Header */}
      <div className="h-[52px] flex items-center px-[18px] border-b border-border bg-accent/10 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
            <GeckoLogo size={14} className="text-black fill-current" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[160px]">
            <span className="font-bold tracking-tight text-foreground truncate text-xs uppercase whitespace-nowrap">
              {orgName || 'GEKKO'}
            </span>
            <span className="text-[9px] text-purple-500 font-bold tracking-widest uppercase whitespace-nowrap">WORKSPACE</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-6 overflow-y-auto px-2 custom-scrollbar">
        {orgId ? (
          <>
            {/* Top Level Section */}
            <div className="flex flex-col gap-1">
              <NavItem 
                label="Dashboard" 
                href={`/${orgId}`} 
                icon={LayoutDashboard} 
                active={pathname === `/${orgId}`} 
              />
              <div className="relative group/item">
                <button 
                  onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                  className="flex items-center h-10 w-full gap-3 px-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                >
                  <div className="flex-shrink-0 w-5 flex justify-center">
                    <Search size={18} strokeWidth={2} className="text-muted-foreground/70 group-hover/item:text-foreground" />
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[160px]">
                    Search
                  </span>
                </button>
                <div className="absolute left-full ml-4 px-2 py-1 bg-popover border border-border rounded text-[10px] font-bold text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 lg:group-hover:hidden transition-opacity z-[60] shadow-xl uppercase tracking-widest hidden lg:block">
                  Search
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="flex flex-col gap-1">
              <div className="px-3 py-1 flex items-center justify-between group/title min-h-[24px]">
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[160px]">
                  Projects
                </span>
                <button 
                  onClick={handleCreateProject}
                  className="p-1 text-muted-foreground/50 hover:text-purple-500 hover:bg-purple-500/10 rounded transition-all lg:opacity-0 lg:group-hover:opacity-100"
                  title="New Project"
                >
                  <Plus size={12} />
                </button>
              </div>
              
              <div className="flex flex-col gap-1">
                {projects.map(project => {
                  const isActive = projectId === project.id
                  return (
                    <div key={project.id} className="flex flex-col gap-1">
                      <NavItem 
                        label={project.name} 
                        href={`/${orgId}/projects/${project.id}`} 
                        icon={FolderOpen} 
                        active={isActive && pathname === `/${orgId}/projects/${project.id}`} 
                      />

                      {/* Nested Views for Active Project */}
                      {isActive && (
                        <div className="flex flex-col gap-1 overflow-hidden transition-all duration-300 lg:max-h-0 lg:opacity-0 lg:group-hover:max-h-[500px] lg:group-hover:opacity-100 lg:ml-4 lg:pl-4 lg:border-l lg:border-border/50">
                          <NavItem 
                            label="Tickets" 
                            href={`/${orgId}/projects/${project.id}/tickets`} 
                            icon={Ticket} 
                            active={pathname.includes('/tickets')} 
                          />
                          <NavItem 
                            label="Sprints" 
                            href={`/${orgId}/projects/${project.id}/sprints`} 
                            icon={Zap} 
                            active={pathname.includes('/sprints')} 
                          />
                          <NavItem 
                            label="Calendar" 
                            href={`/${orgId}/projects/${project.id}/calendar`} 
                            icon={Calendar} 
                            active={pathname.includes('/calendar')} 
                          />
                          <NavItem 
                            label="Team" 
                            href={`/${orgId}/projects/${project.id}/team`} 
                            icon={Users} 
                            active={pathname.includes('/team')} 
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="px-3 py-4 text-center">
            <p className="text-[10px] text-muted-foreground italic uppercase tracking-tighter transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 whitespace-nowrap overflow-hidden">
              Create workspace
            </p>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-border bg-accent/5 p-2 flex flex-col gap-1">
        {orgId && (
          <NavItem 
            label="Settings" 
            href={`/${orgId}/settings`} 
            icon={Settings} 
            active={pathname.includes('/settings')} 
          />
        )}
        
        <div className="h-px bg-border/50 my-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" />
        
        {user && (
          <div className="relative group/item">
            <div className="flex items-center h-12 gap-3 px-3 rounded-md text-muted-foreground group-hover/item:bg-accent/50 transition-all overflow-hidden">
              <div className="flex-shrink-0 w-5 flex justify-center items-center">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-500">
                  {user.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col min-w-0 transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[120px]">
                <span className="text-[11px] font-bold text-foreground truncate whitespace-nowrap">{user.email?.split('@')[0]}</span>
                <span className="text-[9px] text-muted-foreground truncate uppercase tracking-tighter whitespace-nowrap">Developer</span>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-auto p-1.5 text-muted-foreground hover:text-destructive transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-auto"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
            <div className="absolute left-full ml-4 px-2 py-1 bg-popover border border-border rounded text-[10px] font-bold text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 lg:group-hover:hidden transition-opacity z-[60] shadow-xl uppercase tracking-widest hidden lg:block">
              {user.email}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
