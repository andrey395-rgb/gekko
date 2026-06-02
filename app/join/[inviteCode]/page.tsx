"use client"

import { useState, useEffect, use as useReact } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Users, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { GeckoLogo } from '@/components/GeckoLogo'
import { toast } from 'react-hot-toast'

export default function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = useReact(params)
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrg = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single()
      
      if (data) {
        setOrg(data)
      } else {
        toast.error('Invalid or expired invite link')
      }
      setIsLoading(false)
    }
    fetchOrg()
  }, [inviteCode, supabase])

  const handleJoin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?returnTo=/join/${inviteCode}`)
      return
    }

    setIsJoining(true)
    const { data: orgId, error } = await supabase.rpc('join_organization_by_invite_code', {
      target_invite_code: inviteCode
    })

    if (error) {
      toast.error(error.message)
      setIsJoining(false)
    } else {
      toast.success(`Joined ${org?.name}!`)
      router.push(`/${orgId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Invite not found</h1>
        <p className="text-muted text-sm mb-6">This invitation link may have expired or is invalid.</p>
        <button onClick={() => router.push('/')} className="text-primary font-bold hover:underline">Return Home</button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 relative">
            <GeckoLogo size={40} className="text-black fill-current" />
            <div className="absolute -right-2 -bottom-2 bg-background p-1.5 rounded-lg border border-border shadow-lg">
              <Users size={20} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">You're Invited!</h1>
          <p className="text-muted text-sm">
            Join <span className="text-foreground font-bold">{org.name}</span> on Gekko to start collaborating with the team.
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg text-left">
              <ShieldCheck size={20} className="text-purple-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Your Role</span>
                <span className="text-xs font-bold text-foreground">Standard Member</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isJoining ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>Accept Invitation <ArrowRight size={18} /></>
            )}
          </button>
        </div>

        <p className="text-[11px] text-muted">
          By joining, you agree to the organization's terms and will be visible to other team members.
        </p>
      </div>
    </div>
  )
}
