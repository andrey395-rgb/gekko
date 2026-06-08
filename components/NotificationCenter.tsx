"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, Check, X, Building2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Invite = {
  id: string
  organization_id: string
  role: string
  organizations: {
    name: string
  }
}

export default function NotificationCenter() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchInvites()

    // Real-time listener for new invites
    const channel = supabase
      .channel('invites_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invites' },
        () => fetchInvites()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const fetchInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      console.log('No user email found for notifications')
      return
    }

    console.log('Fetching invites for:', user.email)
    const { data, error } = await supabase
      .from('invites')
      .select(`
        id,
        organization_id,
        role,
        organizations(name)
      `)
      .eq('email', user.email)
      .eq('status', 'pending')

    if (error) {
      console.error('Error fetching invites details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('Invites found:', data)
      setInvites(data as any)
    }
  }

  const handleAccept = async (inviteId: string) => {
    setIsProcessing(inviteId)
    try {
      const { data: orgId, error } = await supabase.rpc('accept_invite', {
        target_invite_id: inviteId
      })

      if (error) throw error

      toast.success('Joined workspace!')
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      router.push(`/${orgId}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to join')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDecline = async (inviteId: string) => {
    setIsProcessing(inviteId)
    const { error } = await supabase
      .from('invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)

    if (error) {
      toast.error('Failed to decline')
    } else {
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      toast.success('Invite declined')
    }
    setIsProcessing(null)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted hover:text-foreground hover:bg-accent rounded-lg transition-all"
      >
        <Bell size={18} />
        {invites.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 border-2 border-background rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-[320px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-border bg-accent/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">Notifications</span>
              {invites.length > 0 && (
                <span className="text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full">
                  {invites.length} NEW
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {invites.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 bg-accent/50 rounded-full flex items-center justify-center mx-auto text-muted/50">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs text-muted font-medium">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {invites.map(invite => (
                    <div key={invite.id} className="p-4 space-y-3 hover:bg-accent/10 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Building2 size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground leading-snug">
                            You've been invited to join <span className="font-bold">{invite.organizations.name}</span> as a <span className="font-bold">{invite.role}</span>.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pl-11">
                        <button
                          onClick={() => handleAccept(invite.id)}
                          disabled={!!isProcessing}
                          className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                        >
                          {isProcessing === invite.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(invite.id)}
                          disabled={!!isProcessing}
                          className="flex-1 bg-accent text-foreground py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-border transition-all flex items-center justify-center gap-1.5 border border-border"
                        >
                          {isProcessing === invite.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Decline
                        </button>
                      </div>
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
