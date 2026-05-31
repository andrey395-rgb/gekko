"use client"

import { useState, useEffect } from 'react'
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
  Ticket
} from 'lucide-react'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    blockers: 0,
    pullRequests: 0 
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const GITHUB_OWNER = 'facebook' 
  const GITHUB_REPO = 'react'     

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')

      let ticketMetrics = { total: 0, open: 0, inProgress: 0, closed: 0, blockers: 0 }
      
      if (!error && tickets) {
        ticketMetrics = {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'Open').length,
          inProgress: tickets.filter(t => t.status === 'In Progress').length,
          closed: tickets.filter(t => t.status === 'Closed').length,
          blockers: tickets.filter(t => t.is_blocked).length 
        }
      }

      let prCount = 0
      try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=open`)
        if (response.ok) {
          const prs = await response.json()
          prCount = prs.length
        }
      } catch (err) {
        console.error("Failed to fetch GitHub PRs:", err)
      }

      setMetrics({
        ...ticketMetrics,
        pullRequests: prCount
      })
      
      setIsLoading(false)
    }

    fetchDashboardData()
  }, [])

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
              <span className={`text-2xl font-bold ${isLoading ? 'opacity-20 animate-pulse' : 'opacity-100'}`}>
                {isLoading ? '0' : metric.value}
              </span>
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
            <div className="p-12 flex flex-col items-center justify-center text-center h-[calc(400px-53px)]">
              <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mb-4">
                <Ticket size={24} className="text-muted" />
              </div>
              <h3 className="text-sm font-medium text-foreground">No recent activity</h3>
              <p className="text-xs text-muted mt-1 max-w-[200px]">Your team's latest ticket updates will appear here.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden min-h-[250px]">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">My Focus</h2>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center h-[calc(250px-53px)]">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              <h3 className="text-sm font-medium text-foreground">All caught up</h3>
              <p className="text-xs text-muted mt-1 max-w-[180px]">You have no urgent tasks assigned for today.</p>
            </div>
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