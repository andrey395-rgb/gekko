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
  ChevronRight,
  Plus,
  Calendar,
  Layers
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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

  const NavItem = ({ label, href, icon: Icon, active, collapsed = false }: any) => (
    <Link 
      href={href}
      onClick={() => setIsDrawerOpen(false)}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${
        active 
          ? 'bg-purple-500/10 text-purple-500 border-l-2 border-purple-500 rounded-l-none' 
          : 'text-muted hover:text-foreground hover:bg-accent'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.5} className={active ? 'text-purple-500' : 'text-muted/70 group-hover:text-foreground'} />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
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
    <div className="flex flex-col h-full bg-card">
      {/* Sidebar Header */}
      <div className="h-[52px] flex items-center px-4 border-b border-border bg-accent/10">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
            <GeckoLogo size={14} className="text-black fill-current" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold tracking-tight text-foreground md:hidden lg:block truncate text-xs uppercase">
              {orgName || 'GEKKO'}
            </span>
            <span className="text-[9px] text-purple-500 font-bold tracking-widest md:hidden lg:block">WORKSPACE</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-6 overflow-y-auto px-2">
        {/* Top Level Section */}
        <div className="flex flex-col gap-1">
          <NavItem 
            label="My Dashboard" 
            href={orgId ? `/${orgId}` : '/'} 
            icon={LayoutDashboard} 
            active={orgId ? pathname === `/${orgId}` : pathname === '/'} 
          />
          <button className="flex items-center gap-3 px-3 py-2 text-muted hover:text-foreground hover:bg-accent rounded-md transition-all group">
            <Search size={18} strokeWidth={1.5} className="text-muted/70 group-hover:text-foreground" />
            <span className="text-sm font-medium">Search</span>
            <span className="ml-auto text-[10px] bg-accent px-1.5 py-0.5 rounded border border-border text-muted/50 group-hover:text-muted">⌘K</span>
          </button>
        </div>

        {/* Projects Section */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 flex items-center justify-between group">
            <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">Projects</span>
            <button 
              onClick={handleCreateProject}
              className="p-1 text-muted/50 hover:text-purple-500 hover:bg-purple-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
            >
              <Plus size={12} />
            </button>
          </div>
          
          <div className="flex flex-col gap-0.5">
            {projects.map(project => {
              const isActive = projectId === project.id
              return (
                <div key={project.id} className="flex flex-col gap-0.5">
                  <Link 
                    href={`/${orgId}/projects/${project.id}`}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all group ${
                      isActive 
                        ? 'text-foreground font-semibold' 
                        : 'text-muted hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <FolderOpen size={16} strokeWidth={isActive ? 2 : 1.5} className={isActive ? 'text-purple-500' : 'text-muted/50'} />
                    <span className="text-sm truncate">{project.name}</span>
                  </Link>

                  {/* Nested Views for Active Project */}
                  {isActive && (
                    <div className="ml-4 pl-4 border-l border-border/50 flex flex-col gap-0.5 mt-0.5 mb-2">
                      <NavItem 
                        label="Overview" 
                        href={`/${orgId}/projects/${project.id}`} 
                        icon={Layers} 
                        active={pathname === `/${orgId}/projects/${project.id}`} 
                      />
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
            {!loading && projects.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-muted italic">No projects yet</p>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border flex flex-col gap-1">
        <Link 
          href={orgId ? `/${orgId}/settings` : "/settings"} 
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
            pathname.includes('/settings') ? 'text-purple-500 bg-purple-500/5' : 'text-muted hover:text-foreground hover:bg-accent'
          }`}
        >
          <Settings size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </div>
  )
}
