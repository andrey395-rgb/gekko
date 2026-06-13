"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import ReactMarkdown from 'react-markdown'
import { 
  Send, 
  Calendar, 
  User, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle,
  Clock,
  ChevronRight,
  X,
  Plus,
  Ticket
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type Standup = {
  id: string
  profile_id: string
  yesterday: string
  today: string
  blockers: string
  date: string
  profiles: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

type Ticket = {
  id: number
  title: string
  status: string
}

export default function StandupModule({ 
  orgId, 
  isOpen, 
  onClose 
}: { 
  orgId: string
  isOpen: boolean
  onClose: () => void
}) {
  const [standups, setStandups] = useState<Standup[]>([])
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false)

  // Form state
  const [yesterday, setYesterday] = useState('')
  const [today, setToday] = useState('')
  const [blockers, setBlockers] = useState('')
  const [activeField, setActiveField] = useState<'yesterday' | 'today' | 'blockers'>('yesterday')

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchData()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, orgId])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    if (user) {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: standupsData } = await supabase
        .from('standups')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', orgId)
        .eq('date', todayStr)

      if (standupsData) {
        setStandups(standupsData as any)
        const submitted = standupsData.some(s => s.profile_id === user.id)
        setHasSubmittedToday(submitted)
      }

      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, title, status')
        .eq('organization_id', orgId)
        .eq('assignee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (ticketsData) {
        setRecentTickets(ticketsData)
      }
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsSubmitting(true)
    const { error } = await supabase
      .from('standups')
      .insert({
        organization_id: orgId,
        profile_id: currentUser.id,
        yesterday,
        today,
        blockers,
        date: new Date().toISOString().split('T')[0]
      })

    if (error) {
      toast.error(`Failed to submit: ${error.message || 'Unknown error'}`)
      console.error('Standup submission error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      toast.success('Standup submitted!')
      setHasSubmittedToday(true)
      fetchData()
    }
    setIsSubmitting(false)
  }

  const insertTicketLink = (ticket: Ticket) => {
    const link = `[#${ticket.id} - ${ticket.title}](/${orgId}/tickets?id=${ticket.id})`
    if (activeField === 'yesterday') setYesterday(prev => prev + (prev ? ' ' : '') + link)
    if (activeField === 'today') setToday(prev => prev + (prev ? ' ' : '') + link)
    if (activeField === 'blockers') setBlockers(prev => prev + (prev ? ' ' : '') + link)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border z-[101] shadow-2xl transition-transform duration-500 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Team Standups</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 hover:bg-accent rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Syncing Feed...</p>
            </div>
          ) : (
            <>
              {/* Team Updates Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Latest Updates</h3>
                  <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {standups.length} Members
                  </span>
                </div>
                
                {standups.length > 0 ? (
                  <div className="space-y-4">
                    {standups.map(standup => (
                      <div key={standup.id} className="bg-card/30 border border-border rounded-xl overflow-hidden group hover:border-border/80 transition-all">
                        <div className="p-3 border-b border-border flex items-center justify-between bg-card/50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-accent border border-border flex items-center justify-center text-muted overflow-hidden shrink-0">
                              {standup.profiles.avatar_url ? (
                                <img src={standup.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{standup.profiles.full_name || standup.profiles.email}</span>
                          </div>
                          <Clock className="w-3 h-3 text-muted-foreground/50" />
                        </div>
                        <div className="p-4 space-y-4 text-[13px] leading-relaxed">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3 text-primary/60" /> Yesterday
                            </div>
                            <div className="text-foreground/90 pl-4.5 prose dark:prose-invert prose-sm max-w-none">
                              <ReactMarkdown>{standup.yesterday}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              <MessageSquare className="w-3 h-3 text-primary/60" /> Today
                            </div>
                            <div className="text-foreground/90 pl-4.5 prose dark:prose-invert prose-sm max-w-none">
                              <ReactMarkdown>{standup.today}</ReactMarkdown>
                            </div>
                          </div>
                          {standup.blockers && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                <AlertCircle className="w-3 h-3 text-primary/60" /> Blockers
                              </div>
                              <div className="text-foreground/90 pl-4.5 prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{standup.blockers}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-6 bg-card/10 border border-dashed border-border rounded-2xl text-center">
                    <Clock className="w-8 h-8 text-muted/30 mb-3" />
                    <p className="text-xs text-muted-foreground font-medium">No updates found for today.</p>
                  </div>
                )}
              </div>

              {/* Submission Form Section */}
              {!hasSubmittedToday && (
                <div className="space-y-6 pt-4 border-t border-border">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Post Update</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                    <div className="space-y-1 overflow-hidden rounded-xl border border-border bg-card/20">
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 z-10 flex items-center gap-1.5 pointer-events-none">
                          <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Yesterday</span>
                        </div>
                        <textarea
                          className="w-full bg-input border-b border-border p-3 pt-9 text-xs text-foreground focus:bg-accent/40 outline-none transition-all h-24 resize-none placeholder:text-muted-foreground/30"
                          placeholder="What did you get done?"
                          value={yesterday}
                          onChange={(e) => setYesterday(e.target.value)}
                          onFocus={() => setActiveField('yesterday')}
                        />
                      </div>
                      
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 z-10 flex items-center gap-1.5 pointer-events-none">
                          <MessageSquare className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Today</span>
                        </div>
                        <textarea
                          className="w-full bg-input border-b border-border p-3 pt-9 text-xs text-foreground focus:bg-accent/40 outline-none transition-all h-24 resize-none placeholder:text-muted-foreground/30"
                          placeholder="What's on the radar?"
                          value={today}
                          onChange={(e) => setToday(e.target.value)}
                          onFocus={() => setActiveField('today')}
                        />
                      </div>

                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 z-10 flex items-center gap-1.5 pointer-events-none">
                          <AlertCircle className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Blockers</span>
                        </div>
                        <textarea
                          className="w-full bg-input p-3 pt-9 text-xs text-foreground focus:bg-accent/40 outline-none transition-all h-20 resize-none placeholder:text-muted-foreground/30"
                          placeholder="Any red flags?"
                          value={blockers}
                          onChange={(e) => setBlockers(e.target.value)}
                          onFocus={() => setActiveField('blockers')}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {recentTickets.length > 0 ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <Ticket size={10} /> Link Tickets
                          </div>
                          <div className="flex flex-col gap-2">
                            {recentTickets.map(ticket => (
                              <button
                                key={ticket.id}
                                type="button"
                                onClick={() => insertTicketLink(ticket)}
                                className="text-left bg-card hover:bg-primary/5 border border-border hover:border-primary/20 rounded-lg p-2.5 transition-all group active:scale-[0.97]"
                              >
                                <div className="text-[9px] font-bold text-primary/60 mb-1 flex items-center gap-1">
                                  <Plus size={8} /> #{ticket.id}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium truncate group-hover:text-foreground/80">
                                  {ticket.title}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4 bg-card/20 border border-dashed border-border rounded-xl text-center">
                          <Ticket className="w-6 h-6 text-muted/20 mb-2" />
                          <p className="text-[10px] text-muted-foreground/50 font-medium italic leading-tight">No active tickets</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !yesterday || !today}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black uppercase tracking-[0.1em] py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-accent shadow-lg shadow-primary/10 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Publish Update
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
