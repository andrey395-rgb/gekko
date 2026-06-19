"use client"

import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
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
  LogOut,
  ChevronDown,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  type LucideIcon
} from 'lucide-react'
import { GeckoLogo } from './GeckoLogo'

type Project = {
  id: string
  organization_id: string
  name: string
  description?: string | null
  created_at?: string
}

type ProjectContextMenu = {
  project: Project
  x: number
  y: number
}

type NavItemProps = {
  label: string
  href: string
  icon: LucideIcon
  active: boolean
  trailingIcon?: LucideIcon
  trailingClassName?: string
  onNavigate: () => void
}

function NavItem({ label, href, icon: Icon, active, trailingIcon: TrailingIcon, trailingClassName, onNavigate }: NavItemProps) {
  return (
    <div className="relative group/item">
      <Link 
        href={href}
        onClick={onNavigate}
        className={`flex items-center h-10 gap-3 px-3 rounded-md transition-all ${
          active 
            ? 'bg-purple-500/10 text-purple-500 font-semibold' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        <div className="flex-shrink-0 w-5 flex justify-center">
          <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-purple-500' : 'text-muted-foreground/70 group-hover/item:text-foreground'} />
        </div>
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 lg:opacity-0 lg:max-w-0 lg:group-hover:opacity-100 lg:group-hover:max-w-[160px] flex-1">
          {label}
        </span>
        {TrailingIcon && (
          <div className={`transition-all duration-300 lg:opacity-0 lg:group-hover:opacity-100 ${trailingClassName}`}>
            <TrailingIcon size={14} />
          </div>
        )}
      </Link>
      
      {/* Tooltip (only on desktop and when not expanded) */}
      <div className="absolute left-full ml-4 px-2 py-1 bg-popover border border-border rounded text-[10px] font-bold text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 lg:group-hover:hidden transition-opacity z-[60] shadow-xl uppercase tracking-widest hidden lg:block">
        {label}
      </div>
    </div>
  )
}

export default function Sidebar({ orgName, setIsDrawerOpen }: { orgName: string, setIsDrawerOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const orgId = params?.orgId as string | undefined
  const projectId = params?.projectId as string | undefined
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ProjectContextMenu | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    if (!orgId) return

    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true })
      
      if (data) setProjects(data)
    }

    fetchProjects()

    const handleRefresh = () => {
      fetchProjects()
    }

    window.addEventListener('refresh-projects', handleRefresh)
    return () => {
      window.removeEventListener('refresh-projects', handleRefresh)
    }
  }, [orgId, supabase])

  useEffect(() => {
    if (!contextMenu) return

    const closeContextMenu = () => setContextMenu(null)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu()
    }

    window.addEventListener('click', closeContextMenu)
    window.addEventListener('contextmenu', closeContextMenu)
    window.addEventListener('resize', closeContextMenu)
    window.addEventListener('scroll', closeContextMenu, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', closeContextMenu)
      window.removeEventListener('contextmenu', closeContextMenu)
      window.removeEventListener('resize', closeContextMenu)
      window.removeEventListener('scroll', closeContextMenu, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCreateProject = () => {
    if (!orgId) return
    window.dispatchEvent(new CustomEvent('open-create-project-modal', { detail: { orgId } }))
  }

  const handleProjectContextMenu = (event: ReactMouseEvent, project: Project) => {
    event.preventDefault()
    event.stopPropagation()

    setHoveredProjectId(project.id)
    setContextMenu({
      project,
      x: Math.min(event.clientX, window.innerWidth - 180),
      y: Math.min(event.clientY, window.innerHeight - 170)
    })
  }

  const openProject = (project: Project) => {
    if (!orgId) return
    setContextMenu(null)
    router.push(`/${orgId}/projects/${project.id}`)
    setIsDrawerOpen(false)
  }

  const copyProjectLink = async (project: Project) => {
    if (!orgId) return
    const url = `${window.location.origin}/${orgId}/projects/${project.id}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      prompt('Copy project link:', url)
    }

    setContextMenu(null)
  }

  const renameProject = (project: Project) => {
    if (!orgId) return
    setContextMenu(null)
    window.dispatchEvent(new CustomEvent('open-rename-project-modal', { detail: { project, orgId } }))
  }

  const deleteProject = (project: Project) => {
    if (!orgId) return
    setContextMenu(null)
    window.dispatchEvent(new CustomEvent('open-delete-project-modal', { detail: { project, orgId } }))
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
                onNavigate={() => setIsDrawerOpen(false)}
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
                  const isHovered = hoveredProjectId === project.id
                  const isExpanded = isActive || isHovered

                  return (
                    <div 
                      key={project.id} 
                      className="flex flex-col gap-1 group/folder"
                      onContextMenu={(event) => handleProjectContextMenu(event, project)}
                      onMouseEnter={() => {
                        if (timeoutRef.current) clearTimeout(timeoutRef.current)
                        setHoveredProjectId(project.id)
                      }}
                      onMouseLeave={() => {
                        timeoutRef.current = setTimeout(() => {
                          setHoveredProjectId(null)
                        }, 150)
                      }}
                    >
                      <NavItem 
                        label={project.name} 
                        href={`/${orgId}/projects/${project.id}`} 
                        icon={FolderOpen} 
                        active={isActive && pathname === `/${orgId}/projects/${project.id}`}
                        trailingIcon={ChevronDown}
                        trailingClassName={isExpanded ? 'rotate-180' : 'rotate-0'}
                        onNavigate={() => setIsDrawerOpen(false)}
                      />

                      {/* Nested Views for Project */}
                      <div className={`
                        flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-out ml-4 pl-4 border-l border-border/50
                        ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                        group-focus-within/folder:max-h-[500px] group-focus-within/folder:opacity-100
                        lg:max-h-0 lg:opacity-0 
                        ${isExpanded ? 'lg:group-hover:max-h-[500px] lg:group-hover:opacity-100' : 'lg:group-hover:max-h-0 lg:group-hover:opacity-0'}
                        lg:group-focus-within/folder:max-h-[500px] lg:group-focus-within/folder:opacity-100
                      `}>
                        <NavItem 
                          label="Tickets" 
                          href={`/${orgId}/projects/${project.id}/tickets`} 
                          icon={Ticket} 
                          active={pathname.includes('/tickets')} 
                          onNavigate={() => setIsDrawerOpen(false)}
                        />
                        <NavItem 
                          label="Sprints" 
                          href={`/${orgId}/projects/${project.id}/sprints`} 
                          icon={Zap} 
                          active={pathname.includes('/sprints')} 
                          onNavigate={() => setIsDrawerOpen(false)}
                        />
                        <NavItem 
                          label="Calendar" 
                          href={`/${orgId}/projects/${project.id}/calendar`} 
                          icon={Calendar} 
                          active={pathname.includes('/calendar')} 
                          onNavigate={() => setIsDrawerOpen(false)}
                        />
                        <NavItem 
                          label="Team" 
                          href={`/${orgId}/projects/${project.id}/team`} 
                          icon={Users} 
                          active={pathname.includes('/team')} 
                          onNavigate={() => setIsDrawerOpen(false)}
                        />
                      </div>
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
            onNavigate={() => setIsDrawerOpen(false)}
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

      {contextMenu && (
        <div
          className="fixed z-[100] w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
          role="menu"
          aria-label={`${contextMenu.project.name} project actions`}
        >
          <button
            type="button"
            onClick={() => openProject(contextMenu.project)}
            className="flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium hover:bg-accent"
            role="menuitem"
          >
            <ExternalLink size={14} />
            Open
          </button>
          <button
            type="button"
            onClick={() => renameProject(contextMenu.project)}
            className="flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium hover:bg-accent"
            role="menuitem"
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            type="button"
            onClick={() => copyProjectLink(contextMenu.project)}
            className="flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium hover:bg-accent"
            role="menuitem"
          >
            <Copy size={14} />
            Copy link
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => deleteProject(contextMenu.project)}
            className="flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium text-destructive hover:bg-destructive/10"
            role="menuitem"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
