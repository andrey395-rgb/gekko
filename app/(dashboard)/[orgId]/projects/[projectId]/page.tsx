"use client"

import { useState, useEffect, useRef, use as useReact } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  BarChart3, 
  CircleDot, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  GitPullRequest,
  TrendingUp,
  ArrowRight,
  Ticket,
  Tag,
  Calendar,
  Zap,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import StandupModule from '@/components/StandupModule'
import { toast } from 'react-hot-toast'

export default function DashboardPage({ params }: { params: Promise<{ orgId: string, projectId: string }> }) {
  const { orgId, projectId } = useReact(params)
  
  if (!orgId || !projectId) {
    return <div className="p-8 text-center text-red-500">Error: Missing Organization or Project ID</div>
  }

  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    blockers: 0,
    pullRequests: 0,
    isConfigured: false
  })

  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [personalNote, setPersonalNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved')
  const [sprints, setSprints] = useState<any[]>([])
  const [currentSprintIndex, setCurrentSprintIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isStandupPanelOpen, setIsStandupPanelOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch organization config for GitHub
      const { data: orgConfig } = await supabase
        .from('organizations')
        .select('github_owner, github_repo')
        .eq('id', orgId)
        .single()

      // Fetch all tickets for metrics, filtered by projectId
      const { data: allTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId)

      // Fetch 5 most recent tickets, filtered by projectId
      const { data: recent, error: recentError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!recentError && recent) {
        setRecentTickets(recent)
      }

      // Fetch all sprints
      const today = new Date().toISOString().split('T')[0]
      const { data: sprintsData } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: false })
      
      if (sprintsData && sprintsData.length > 0) {
        setSprints(sprintsData)
        const activeIdx = sprintsData.findIndex(s => s.start_date <= today && s.end_date >= today)
        setCurrentSprintIndex(activeIdx !== -1 ? activeIdx : 0)
      } else {
        setSprints([])
      }

      // Fetch personal note
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('personal_note')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setPersonalNote(profile.personal_note || '')
        }
      }

      let ticketMetrics = { total: 0, open: 0, inProgress: 0, closed: 0, blockers: 0 }

      if (!ticketsError && allTickets) {
        ticketMetrics = {
          total: allTickets.length,
          open: allTickets.filter(t => t.status === 'Open').length,
          inProgress: allTickets.filter(t => t.status === 'In Progress').length,
          closed: allTickets.filter(t => t.status === 'Closed').length,
          blockers: allTickets.filter(t => t.is_blocked).length 
        }
      }

      let prCount = 0
      let prError = false
      if (orgConfig?.github_owner && orgConfig?.github_repo) {
        try {
          const owner = orgConfig.github_owner.trim()
          const repo = orgConfig.github_repo.trim()
          
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open`, {
            cache: 'no-store',
            headers: {
              'Accept': 'application/vnd.github.v3+json'
            }
          })
          
          if (response.ok) {
            const prs = await response.json()
            prCount = prs.length
          } else {
            prError = true
          }
        } catch (err) {
          prError = true
        }
      }

      setMetrics({
        ...ticketMetrics,
        pullRequests: prCount,
        isConfigured: !!(orgConfig?.github_owner && orgConfig?.github_repo)
      })

      setIsLoading(false)
    }

    fetchDashboardData()
  }, [orgId, projectId, supabase])

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setPersonalNote(val)
    setSaveStatus('saving')
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .update({ personal_note: val })
          .eq('id', user.id)
          .select()
          
        if (error || !data || data.length === 0) {
          console.error("Error saving note:", error || "RLS policy blocked update")
          toast.error("Failed to save note. Make sure the database schema is updated.")
          setSaveStatus('idle')
        } else {
          setSaveStatus('saved')
        }
      }
    }, 1000)
  }

  // Helpers for Sprint & Calendar
  const activeSprint = sprints[currentSprintIndex] || null

  const getSprintProgress = () => {
    if (!activeSprint) return { percent: 0, daysLeft: 0 }
    const start = new Date(activeSprint.start_date).getTime()
    const end = new Date(activeSprint.end_date).getTime()
    const now = new Date().getTime()
    
    const totalDuration = end - start
    const elapsed = now - start
    let percent = Math.round((elapsed / totalDuration) * 100)
    percent = Math.max(0, Math.min(100, percent))
    
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return { percent, daysLeft: Math.max(0, daysLeft) }
  }

  const generateFullCalendar = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ isEmpty: true })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
      
      days.push({
        isEmpty: false,
        date: d,
        dateStr: localISOTime,
        dayNum: i,
        isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
      })
    }
    return days
  }

  const sprintProgress = getSprintProgress()
  const fullCalendar = generateFullCalendar()
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Real-time overview of your development workspace.</p>
        </div>
        <button 
          onClick={() => setIsStandupPanelOpen(true)}
          className="group relative bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2 transform active:scale-95"
        >
          <Calendar size={14} />
          Daily Standups
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-400 border-2 border-slate-950 rounded-full animate-pulse"></span>
        </button>
      </div>

      <StandupModule 
        orgId={orgId} 
        isOpen={isStandupPanelOpen} 
        onClose={() => setIsStandupPanelOpen(false)} 
      />

      {/* Top Widgets Row: Active Sprint & Mini Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sprint Widget */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-accent/10">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentSprintIndex(prev => Math.min(sprints.length - 1, prev + 1))}
                disabled={currentSprintIndex === sprints.length - 1 || sprints.length === 0}
                className="p-1 hover:bg-accent rounded disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} className="text-muted" />
              </button>
              <Zap size={16} className="text-purple-500" />
              <h2 className="text-sm font-semibold text-foreground">
                {activeSprint ? activeSprint.name : "Sprint Overview"}
              </h2>
              <button 
                onClick={() => setCurrentSprintIndex(prev => Math.max(0, prev - 1))}
                disabled={currentSprintIndex === 0 || sprints.length === 0}
                className="p-1 hover:bg-accent rounded disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} className="text-muted" />
              </button>
            </div>
            {activeSprint && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {sprintProgress.daysLeft > 0 ? `${sprintProgress.daysLeft} Days Remaining` : 'Ended'}
              </span>
            )}
          </div>
          <div className="p-6 flex flex-col justify-center flex-1">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-2 w-full mt-4" />
              </div>
            ) : activeSprint ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{activeSprint.name}</h3>
                  {activeSprint.goal && (
                    <p className="text-sm text-muted mt-1 font-medium">{activeSprint.goal}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                    <span>Progress</span>
                    <span className="text-purple-500">{sprintProgress.percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-1000 ease-out"
                      style={{ width: `${sprintProgress.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted font-medium">
                    <span>{new Date(activeSprint.start_date).toLocaleDateString()}</span>
                    <span>{new Date(activeSprint.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mb-3">
                  <Zap size={20} className="text-muted/50" />
                </div>
                <p className="text-sm font-medium text-foreground">No active sprint</p>
                <p className="text-xs text-muted mt-1">Start a new sprint to track team progress.</p>
                <button 
                  onClick={() => window.location.href = `/${orgId}/projects/${projectId}/sprints`}
                  className="mt-4 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                >
                  Plan Sprint
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full Month Calendar Widget */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border bg-accent/10 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="w-full grid grid-cols-7 gap-1 mb-2">
              {weekdays.map((day, index) => (
                <div key={`weekday-${index}`} className="text-[10px] font-bold text-muted uppercase tracking-widest text-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="w-full grid grid-cols-7 gap-1">
              {fullCalendar.map((day, i) => {
                if (day.isEmpty) {
                  return <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
                }
                
                const isSprintBoundary = activeSprint && (
                  day.dateStr === activeSprint.start_date ||
                  day.dateStr === activeSprint.end_date
                )
                
                return (
                  <div key={i} className="flex flex-col items-center justify-center">
                    <div className={`
                      w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all relative
                      ${day.isToday 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 z-10' 
                        : 'bg-accent/50 text-foreground border border-transparent hover:border-primary/50'
                      }
                    `}>
                      {day.dayNum}
                      {isSprintBoundary && !day.isToday && (
                        <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-purple-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 flex flex-col h-full">
          {/* Personal Scratchpad */}
          <div className="bg-card rounded-lg border border-border shadow-sm flex-1 flex flex-col min-h-[400px] relative">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-accent/10 shrink-0">
              <h2 className="text-sm font-semibold text-foreground">Personal Scratchpad</h2>
              <div className="text-[10px] text-muted font-medium flex items-center gap-1">
                {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin" /> Saving</>}
                {saveStatus === 'saved' && <><Check size={10} className="text-purple-500" /> Saved</>}
              </div>
            </div>
            <textarea
              value={personalNote}
              onChange={handleNoteChange}
              placeholder="Scratchpad for your daily to-dos, quick thoughts, or active focus..."
              className="w-full flex-1 bg-transparent p-5 text-sm text-foreground/90 placeholder:text-muted/40 outline-none resize-none custom-scrollbar leading-relaxed"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Tickets</h2>
              <button 
                onClick={() => window.location.href = `/${orgId}/projects/${projectId}/tickets`}
                className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : recentTickets.length > 0 ? (
                recentTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => window.location.href = `/${orgId}/projects/${projectId}/tickets?id=${ticket.id}`}
                    className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Ticket size={18} className="text-muted group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">{ticket.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Tag size={10} /> {ticket.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-xs text-muted">
                          Priority: {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      ticket.status === 'Closed' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                      ticket.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center h-[calc(400px-53px)]">
                  <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mb-4">
                    <Ticket size={24} className="text-muted" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">No recent activity</h3>
                  <p className="text-xs text-muted mt-1 max-w-[200px]">Your team's latest ticket updates will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}