"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, Check, X, Building2, Loader2, Ticket, ArrowRightLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Invite = {
  type: 'invite'
  id: string
  organization_id: string
  role: string
  organizations: {
    name: string
  }
}

type Transfer = {
  type: 'transfer'
  id: string
  ticket_id: string
  message: string | null
  expires_at: string
  from_profile: {
    full_name: string | null
    email: string
  }
  tickets: {
    title: string
  }
}

type Notification = Invite | Transfer

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()

    // Real-time listener for invites and transfers
    const invitesChannel = supabase
      .channel('invites_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invites' },
        () => fetchNotifications()
      )
      .subscribe()

    const transfersChannel = supabase
      .channel('transfers_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_transfers' },
        () => fetchNotifications()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(invitesChannel)
      supabase.removeChannel(transfersChannel)
    }
  }, [supabase])

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return

    // Fetch Invites
    const { data: invitesData } = await supabase
      .from('invites')
      .select(`
        id,
        organization_id,
        role,
        organizations(name)
      `)
      .eq('email', user.email)
      .eq('status', 'pending')

    // Fetch Transfers
    const { data: transfersData } = await supabase
      .from('ticket_transfers')
      .select(`
        id,
        ticket_id,
        message,
        expires_at,
        from_profile:profiles!from_user_id(full_name, email),
        tickets(title)
      `)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')

    const invites = (invitesData || []).map(i => ({ 
      ...i, 
      type: 'invite' as const,
      organizations: Array.isArray(i.organizations) ? i.organizations[0] : i.organizations
    })) as Invite[]

    const transfers = (transfersData || []).map(t => ({ 
      ...t, 
      type: 'transfer' as const,
      from_profile: Array.isArray(t.from_profile) ? t.from_profile[0] : t.from_profile,
      tickets: Array.isArray(t.tickets) ? t.tickets[0] : t.tickets
    })) as Transfer[]

    setNotifications([...invites, ...transfers])
  }

  const handleAcceptInvite = async (inviteId: string) => {
    setIsProcessing(inviteId)
    try {
      const { data: orgId, error } = await supabase.rpc('accept_invite', {
        target_invite_id: inviteId
      })
      if (error) throw error
      toast.success('Joined workspace!')
      fetchNotifications()
      router.push(`/${orgId}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to join')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeclineInvite = async (inviteId: string) => {
    setIsProcessing(inviteId)
    const { error } = await supabase
      .from('invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)

    if (error) {
      toast.error('Failed to decline')
    } else {
      fetchNotifications()
      toast.success('Invite declined')
    }
    setIsProcessing(null)
  }

  const handleAcceptTransfer = async (transferId: string) => {
    setIsProcessing(transferId)
    try {
      const { error } = await supabase.rpc('accept_ticket_transfer', {
        transfer_id: transferId
      })
      if (error) throw error
      toast.success('Ticket accepted!')
      fetchNotifications()
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept ticket')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeclineTransfer = async (transferId: string) => {
    setIsProcessing(transferId)
    try {
      const { error } = await supabase.rpc('decline_ticket_transfer', {
        transfer_id: transferId
      })
      if (error) throw error
      toast.success('Ticket declined')
      fetchNotifications()
    } catch (error: any) {
      toast.error('Failed to decline')
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted hover:text-foreground hover:bg-accent rounded-lg transition-all"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 border-2 border-background rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-[320px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-border bg-accent/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">Notifications</span>
              {notifications.length > 0 && (
                <span className="text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full">
                  {notifications.length} NEW
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 bg-accent/50 rounded-full flex items-center justify-center mx-auto text-muted/50">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs text-muted font-medium">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-4 space-y-3 hover:bg-accent/10 transition-colors">
                      {notif.type === 'invite' ? (
                        <>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                              <Building2 size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground leading-snug">
                                You've been invited to join <span className="font-bold">{notif.organizations.name}</span> as a <span className="font-bold">{notif.role}</span>.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pl-11">
                            <button
                              onClick={() => handleAcceptInvite(notif.id)}
                              disabled={!!isProcessing}
                              className="flex-1 bg-purple-600 text-white py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-purple-700 transition-all flex items-center justify-center gap-1.5"
                            >
                              {isProcessing === notif.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(notif.id)}
                              disabled={!!isProcessing}
                              className="flex-1 bg-accent text-foreground py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-border transition-all flex items-center justify-center gap-1.5 border border-border"
                            >
                              {isProcessing === notif.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              Decline
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                              <ArrowRightLeft size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground leading-snug">
                                <span className="font-bold">{notif.from_profile.full_name || notif.from_profile.email}</span> wants to transfer a ticket to you:
                              </p>
                              <div className="mt-1.5 p-2 bg-accent/50 rounded border border-border/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <Ticket size={10} className="text-emerald-500" />
                                  <p className="text-[10px] font-bold truncate text-foreground">{notif.tickets.title}</p>
                                </div>
                                {notif.message && (
                                  <p className="text-[10px] text-muted italic line-clamp-2">"{notif.message}"</p>
                                )}
                              </div>
                              <p className="text-[9px] text-muted/60 mt-2 flex items-center gap-1">
                                <span>Expires:</span>
                                <span>{new Date(notif.expires_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pl-11">
                            <button
                              onClick={() => handleAcceptTransfer(notif.id)}
                              disabled={!!isProcessing}
                              className="flex-1 bg-emerald-600 text-white py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                            >
                              {isProcessing === notif.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineTransfer(notif.id)}
                              disabled={!!isProcessing}
                              className="flex-1 bg-accent text-foreground py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-border transition-all flex items-center justify-center gap-1.5 border border-border"
                            >
                              {isProcessing === notif.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              Decline
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
