"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  X, 
  Search, 
  Mail, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  UserPlus,
  Loader2,
  ShieldAlert
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export default function InviteModal({ 
  orgId, 
  onClose,
  onInviteSent
}: { 
  orgId: string
  onClose: () => void
  onInviteSent: () => void
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  // Fetch Invite Code
  useEffect(() => {
    const fetchInviteCode = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('invite_code')
        .eq('id', orgId)
        .single()
      if (data) setInviteCode(data.invite_code)
    }
    fetchInviteCode()
  }, [orgId, supabase])

  // Search Users
  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 3) {
        setResults([])
        return
      }
      setIsSearching(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(5)
      
      if (data) setResults(data)
      setIsSearching(false)
    }

    const timer = setTimeout(searchUsers, 500)
    return () => clearTimeout(timer)
  }, [search, supabase])

  const handleDirectInvite = async (invitedUser: Profile) => {
    // 1. Check if already a member
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('profile_id', invitedUser.id)
      .single()
    
    if (existing) {
      toast.error('User is already a member')
      return
    }

    // 2. Check if already has a pending invite
    const { data: pending } = await supabase
      .from('invites')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', invitedUser.email)
      .eq('status', 'pending')
      .single()

    if (pending) {
      toast.error('Invite already pending for this user')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('invites')
      .insert([{ 
        organization_id: orgId, 
        inviter_id: session.user.id,
        email: invitedUser.email,
        role: 'member'
      }])

    if (error) {
      toast.error('Failed to send invite')
      console.error(error)
    } else {
      toast.success(`Invite sent to ${invitedUser.full_name || invitedUser.email}`)
      onInviteSent()
    }
  }

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('invites')
      .insert([{ 
        organization_id: orgId, 
        email: search, 
        inviter_id: session.user.id,
        role: 'member'
      }])

    if (error) {
      if (error.code === '23505') {
        toast.error('Invite already pending for this email')
      } else {
        toast.error('Failed to send invite')
      }
    } else {
      toast.success(`Invite sent to ${search}`)
      onInviteSent()
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite link copied')
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UserPlus size={20} className="text-primary" /> Invite Team Members
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Method 1: Search */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Search Developers</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find by name or email..." 
                  className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {isSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />}
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {results.length > 0 ? (
                results.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30 border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {(user.full_name || user.email).substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{user.full_name || 'No Name'}</span>
                        <span className="text-[10px] text-muted">{user.email}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDirectInvite(user)}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[10px] font-bold rounded-md transition-all border border-primary/20 uppercase"
                    >
                      Invite
                    </button>
                  </div>
                ))
              ) : search.length >= 3 && !isSearching ? (
                <div className="text-center py-4 bg-accent/10 rounded-lg border border-dashed border-border">
                  <p className="text-xs text-muted">No users found for "{search}"</p>
                  <button 
                    onClick={handleEmailInvite}
                    className="text-[10px] text-primary font-bold hover:underline mt-1"
                  >
                    Invite "{search}" by email?
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Method 2: Link */}
          <div className="space-y-3 pt-6 border-t border-border/50">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Share Invitation Link</label>
              <p className="text-[11px] text-muted mb-2">Anyone with this link can join your workspace.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-accent/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted flex items-center gap-2 overflow-hidden">
                  <LinkIcon size={12} />
                  <span className="truncate">{window.location.origin}/join/{inviteCode}</span>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="bg-card hover:bg-accent border border-border rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 shrink-0 active:scale-95"
                >
                  {copied ? <Check size={14} className="text-purple-500" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-accent/20 border-t border-border flex items-center gap-3">
          <ShieldAlert size={16} className="text-amber-500 shrink-0" />
          <p className="text-[10px] text-muted leading-tight">
            Invited members will have full access to tickets, sprints, and the team roster. You can manage their roles after they join.
          </p>
        </div>
      </div>
    </div>
  )
}
