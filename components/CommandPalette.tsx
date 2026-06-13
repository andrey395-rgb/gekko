"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Search, Ticket, FolderOpen, Loader2, X, Command } from 'lucide-react'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ projects: any[], tickets: any[] }>({ projects: [], tickets: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for ⌘K or Ctrl+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleOpenEvent = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenEvent)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleOpenEvent)
    }
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults({ projects: [], tickets: [] })
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tickets: [] })
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      
      try {
        // Search Projects
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, organization_id')
          .ilike('name', `%${query}%`)
          .limit(5)

        // Search Tickets
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id, title, organization_id, project_id')
          .ilike('title', `%${query}%`)
          .limit(5)

        setResults({
          projects: projects || [],
          tickets: tickets || []
        })
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query, supabase])

  const totalResults = results.projects.length + results.tickets.length

  const handleNavigate = (type: 'project' | 'ticket', item: any) => {
    if (type === 'project') {
      router.push(`/${item.organization_id}/projects/${item.id}`)
    } else {
      router.push(`/${item.organization_id}/projects/${item.project_id}/tickets?ticketId=${item.id}`)
    }
    setIsOpen(false)
  }

  // Keyboard navigation for results
  const handleResultKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % totalResults)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults)
    } else if (e.key === 'Enter') {
      const all = [...results.projects.map(p => ({ ...p, type: 'project' })), ...results.tickets.map(t => ({ ...t, type: 'ticket' }))]
      const selected = all[selectedIndex]
      if (selected) handleNavigate(selected.type as any, selected)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6 md:px-8">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden relative z-[110] animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-accent/20">
          <Search size={18} className="text-muted-foreground" />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleResultKeyDown}
            placeholder="Search projects, tickets..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted-foreground/50 h-6"
          />
          {loading ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-bold text-muted-foreground">
              <Command size={10} /> K
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
          {!query.trim() ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Search size={20} className="text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Quick Search</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Type to find projects or tickets</p>
              </div>
            </div>
          ) : totalResults > 0 ? (
            <div className="space-y-4 py-1">
              {results.projects.length > 0 && (
                <div className="space-y-1">
                  <h3 className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Projects</h3>
                  {results.projects.map((project, idx) => {
                    const globalIdx = idx
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <button
                        key={project.id}
                        onClick={() => handleNavigate('project', project)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-accent/50 text-muted-foreground'}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary-foreground/20' : 'bg-purple-500/10'}`}>
                          <FolderOpen size={16} className={isSelected ? 'text-primary-foreground' : 'text-purple-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{project.name}</p>
                          <p className={`text-[10px] uppercase tracking-tighter ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Navigate to project</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {results.tickets.length > 0 && (
                <div className="space-y-1">
                  <h3 className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Tickets</h3>
                  {results.tickets.map((ticket, idx) => {
                    const globalIdx = results.projects.length + idx
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => handleNavigate('ticket', ticket)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-accent/50 text-muted-foreground'}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary-foreground/20' : 'bg-emerald-500/10'}`}>
                          <Ticket size={16} className={isSelected ? 'text-primary-foreground' : 'text-emerald-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{ticket.title}</p>
                          <p className={`text-[10px] uppercase tracking-tighter ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>View ticket details</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : !loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
              <p className="text-sm font-bold">No results found</p>
              <p className="text-xs">Try searching for something else</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-accent/10 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background text-[9px] font-bold text-muted-foreground">↑↓</kbd>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background text-[9px] font-bold text-muted-foreground">ENTER</kbd>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background text-[9px] font-bold text-muted-foreground">ESC</kbd>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
