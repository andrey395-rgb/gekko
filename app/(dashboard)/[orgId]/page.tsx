"use client"

import { useState, useEffect, use as useReact } from 'react'
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
  Tag
} from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'

export default function DashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = useReact(params)
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    blockers: 0,
    pullRequests: 0 
  })

  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)

      // Fetch organization config for GitHub
      const { data: orgConfig } = await supabase
        .from('organizations')
        .select('github_owner, github_repo')
        .eq('id', orgId)
        .single()

      // Fetch all tickets for metrics, filtered by orgId
      const { data: allTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('organization_id', orgId)

      // Fetch 5 most recent tickets, filtered by orgId
      const { data: recent, error: recentError } = await supabase
        .from('tickets')
        .select('*, profiles!assignee_id(full_name, avatar_url)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!recentError && recent) {
        setRecentTickets(recent)
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
      if (orgConfig?.github_owner && orgConfig?.github_repo) {
        try {
          const response = await fetch(`https://api.github.com/repos/${orgConfig.github_owner}/${orgConfig.github_repo}/pulls?state=open`)
          if (response.ok) {
            const prs = await response.json()
            prCount = prs.length
          }
        } catch (err) {
          console.error("Failed to fetch GitHub PRs:", err)
        }
      }

      setMetrics({
        ...ticketMetrics,
        pullRequests: prCount
      })

      setIsLoading(false)
    }

    fetchDashboardData()
  }, [orgId, supabase])

  const metricCards = [
    { title: 'Total Tickets', value: metrics.total, icon: BarChart3, color: 'text-foreground' },
    { title: 'Open', value: metrics.open, icon: CircleDot, color: 'text-blue-500' },
    { title: 'In Progress', value: metrics.inProgress, icon: Clock, color: 'text-amber-500' },
    { title: 'Closed', value: metrics.closed, icon: CheckCircle2, color: 'text-emerald-500' },
    { title: 'Active Blockers', value: metrics.blockers, icon: AlertCircle, color: 'text-red-500' },
    { title: 'PRs Open', value: metrics.pullRequests, icon: GitPullRequest, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Real-time overview of your development workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric) => (
          <div 
            key={metric.title} 
            className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-col justify-between min-h-[100px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">{metric.title}</span>
              <metric.icon size={16} className={metric.color} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className="text-2xl font-bold text-foreground">
                  {metric.value}
                </span>
              )}
              {!isLoading && <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><TrendingUp size={10} /> +0%</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Tickets</h2>
              <button className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1">
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
                  <div key={ticket.id} className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors cursor-pointer group">
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
                          {ticket.profiles?.full_name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      ticket.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
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

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden min-h-[250px]">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">My Focus</h2>
            </div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center h-[calc(250px-53px)]">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <h3 className="text-sm font-medium text-foreground">All caught up</h3>
                <p className="text-xs text-muted mt-1 max-w-[180px]">You have no urgent tasks assigned for today.</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 gap-2">
              {['Docs', 'Settings', 'API Keys', 'Audit Logs'].map(link => (
                <button key={link} className="flex items-center justify-between p-2 rounded border border-transparent hover:border-border hover:bg-accent transition-all text-left group">
                  <span className="text-xs text-muted group-hover:text-foreground">{link}</span>
                  <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}