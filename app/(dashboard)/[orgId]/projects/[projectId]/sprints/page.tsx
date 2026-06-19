"use client"

import { useState, useEffect, useCallback, use as useReact } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Zap, 
  Plus, 
  Calendar as CalendarIcon, 
  Target, 
  X,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Flag,
  Pencil,
  Trash2
} from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import { toast } from 'react-hot-toast'

type Sprint = {
  id: number
  name: string
  goal: string | null
  start_date: string
  end_date: string
  organization_id: string
  tickets: { status: string }[]
}

export default function SprintsPage({ params }: { params: Promise<{ orgId: string, projectId: string }> }) {
  const { orgId, projectId } = useReact(params)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'timeline'>('grid')
  
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const supabase = createClient()

  const fetchSprints = useCallback(async () => {
    Promise.resolve().then(() => setIsLoading(true))
    const { data, error } = await supabase
      .from('sprints')
      .select('*, tickets(status)')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching sprints:', error)
      toast.error('Failed to load sprints')
    } else if (data) {
      setSprints(data as unknown as Sprint[])
    }
    setIsLoading(false)
  }, [projectId, supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSprints()
    }, 0)

    const handleRefresh = () => {
      fetchSprints()
    }
    window.addEventListener('refresh-sprints', handleRefresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('refresh-sprints', handleRefresh)
    }
  }, [fetchSprints])

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('sprints')
      .insert([{ 
        name, 
        goal: goal || null,
        start_date: startDate, 
        end_date: endDate,
        organization_id: orgId,
        project_id: projectId
      }])

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      setIsModalOpen(false)
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      fetchSprints()
      toast.success('Sprint planned successfully')
    }
  }

  const getSprintStatus = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const today = new Date().getTime()

    if (today < start) return { label: 'Upcoming', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
    if (today > end) return { label: 'Past', color: 'text-muted bg-accent border-border' }
    return { label: 'Active', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime()
    const today = new Date().getTime()
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sprints</h1>
          <p className="text-muted text-sm mt-1">Plan and track your team&apos;s development cycles.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-accent rounded-lg p-1 flex items-center border border-border">
            <button 
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setView('timeline')}
              className={`p-1.5 rounded-md transition-all ${view === 'timeline' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
              title="Timeline View"
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> New Sprint
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-4">
                <Skeleton className="h-4 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))
          ) : sprints.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-accent/20 border border-dashed border-border rounded-xl">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
                <Zap size={24} className="text-muted/40" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No cycles planned</h3>
              <p className="text-xs text-muted mt-1 max-w-[200px]">Start your first sprint to begin tracking progress.</p>
            </div>
          ) : (
            sprints.map((sprint) => {
              const status = getSprintStatus(sprint.start_date, sprint.end_date)
              const isActive = status.label === 'Active'
              
              return (
                <div key={sprint.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:border-primary/40 transition-all group">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${status.color}`}>
                        {isActive && <Zap size={10} className="fill-current" />} {status.label}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-edit-sprint-modal', { detail: { sprint, projectId } }))}
                          className="text-muted hover:text-primary p-1 hover:bg-accent rounded transition-all"
                          title="Edit Sprint"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-delete-sprint-modal', { detail: { sprint, projectId } }))}
                          className="text-muted hover:text-destructive p-1 hover:bg-accent rounded transition-all"
                          title="Delete Sprint"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{sprint.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                        <CalendarIcon size={12} />
                        {new Date(sprint.start_date).toLocaleDateString()} — {new Date(sprint.end_date).toLocaleDateString()}
                      </div>
                    </div>

                    {sprint.goal && (
                      <div className="bg-accent/30 p-3 rounded-lg border border-border/40">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                          <Target size={12} /> Goal
                        </div>
                        <p className="text-[12px] text-foreground/80 leading-relaxed italic">&quot;{sprint.goal}&quot;</p>
                      </div>
                    )}
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted">
                        <span>Overall Progress ({sprint.tickets?.length || 0} tickets)</span>
                        <span className="text-purple-500">
                          {sprint.tickets?.length > 0 
                            ? Math.round((sprint.tickets.filter(t => t.status === 'Closed').length / sprint.tickets.length) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-500" 
                          style={{ 
                            width: `${sprint.tickets?.length > 0 
                              ? Math.round((sprint.tickets.filter(t => t.status === 'Closed').length / sprint.tickets.length) * 100) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-3 bg-accent/20 border-t border-border flex justify-between items-center group-hover:bg-accent/30 transition-colors cursor-pointer">
                    <span className="text-[11px] font-medium text-muted">View Sprint Board</span>
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-8 relative overflow-hidden">
          {/* Decorative Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--muted) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Compiling Timeline...</span>
            </div>
          ) : sprints.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <CalendarIcon size={32} className="text-muted/20 mb-3" />
              <h3 className="text-sm font-bold text-foreground">No events scheduled</h3>
              <p className="text-xs text-muted mt-1">Your sprint roadmap will appear here.</p>
            </div>
          ) : (
            <div className="space-y-10 relative">
              {/* Timeline Line */}
              <div className="absolute left-[11px] md:left-[156px] top-2 bottom-2 w-0.5 bg-border hidden md:block" />

              {sprints.map((sprint, index) => {
                const status = getSprintStatus(sprint.start_date, sprint.end_date)
                const isActive = status.label === 'Active'

                return (
                  <div key={sprint.id} className="relative flex flex-col md:flex-row gap-6 md:items-start group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                    
                    {/* Desktop Date Block */}
                    <div className="hidden md:flex flex-col items-end w-32 shrink-0 pt-1 text-right">
                      <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                        {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-muted font-medium">to</span>
                      <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                        {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Timeline Dot */}
                    <div className={`hidden md:flex w-8 h-8 rounded-full border-4 border-card ${isActive ? 'bg-primary shadow-[0_0_12px_rgba(62,207,142,0.4)]' : 'bg-accent border-border'} z-10 shrink-0 items-center justify-center transition-all group-hover:scale-110`}>
                      {isActive && <Zap size={14} className="text-primary-foreground fill-current" />}
                    </div>

                    {/* Mobile Date Header */}
                    <div className="md:hidden flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted/40'}`} />
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">
                        {new Date(sprint.start_date).toLocaleDateString()} — {new Date(sprint.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Sprint Card */}
                    <div className={`flex-1 p-5 rounded-lg border ${isActive ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/5' : 'bg-accent/20 border-border/60'} transition-all group-hover:bg-accent/40`}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{sprint.name}</h3>
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${status.color}`}>
                            {status.label}
                          </span>
                          <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-edit-sprint-modal', { detail: { sprint, projectId } }))}
                            className="text-muted hover:text-primary p-1 hover:bg-accent rounded transition-all"
                            title="Edit Sprint"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-delete-sprint-modal', { detail: { sprint, projectId } }))}
                            className="text-muted hover:text-destructive p-1 hover:bg-accent rounded transition-all"
                            title="Delete Sprint"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      
                      {sprint.goal && (
                        <div className="flex gap-2 items-start text-[12px] text-muted leading-relaxed italic mb-4">
                          <Target size={14} className="shrink-0 mt-0.5 opacity-40" />
                          &quot;{sprint.goal}&quot;
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/20">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-muted" />
                          <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-muted'}`}>
                            {isActive ? `${getDaysRemaining(sprint.end_date)} DAYS REMAINING` : status.label === 'Past' ? 'COMPLETED' : 'PENDING START'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-muted border border-border px-1.5 py-0.5 rounded uppercase">
                             {sprint.tickets?.length || 0} Tickets
                           </span>
                           <span className="text-[10px] font-bold text-purple-500 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase">
                             {sprint.tickets?.length > 0 
                               ? Math.round((sprint.tickets.filter(t => t.status === 'Closed').length / sprint.tickets.length) * 100) 
                               : 0}% Done
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[10px] font-bold text-muted hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors">
                            DETAILS <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'timeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-xl border border-border flex items-start gap-4 shadow-sm hover:border-border/80 transition-all">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500 shrink-0">
              <Flag size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground tracking-tight">Milestones</h4>
              <p className="text-[12px] text-muted mt-1 leading-relaxed">No project-wide milestones found for the current workspace period.</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border flex items-start gap-4 shadow-sm hover:border-border/80 transition-all">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground tracking-tight">Deadlines</h4>
              <p className="text-[12px] text-muted mt-1 leading-relaxed">Ensure all tickets are moved to &apos;Review&apos; at least 24h before sprint end.</p>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-md h-[95vh] sm:h-auto sm:rounded-xl border-t sm:border border-border flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20 shrink-0">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Zap size={20} className="text-primary" /> Plan Sprint</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSprint} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 Infrastructure Overhaul"
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40 shadow-inner" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint Goal</label>
                <textarea 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[80px] placeholder:text-muted/40 shadow-inner"
                  placeholder="What is the key outcome of this cycle?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Start Date</label>
                  <div className="relative">
                    <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">End Date</label>
                  <div className="relative">
                    <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground hover:bg-accent rounded-lg transition-all border border-transparent hover:border-border"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/10 active:scale-95"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
