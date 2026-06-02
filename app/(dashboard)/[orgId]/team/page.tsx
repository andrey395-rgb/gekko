"use client"

import { useState, useEffect, use as useReact } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Calendar as CalendarIcon, 
  Search,
  MoreVertical,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import InviteModal from '@/components/InviteModal'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export default function TeamPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = useReact(params)
  const [team, setTeam] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const supabase = createClient()

  const fetchTeam = async () => {
    setIsLoading(true)
    // Fetch profiles through organization_members
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        profiles (
          id,
          email,
          full_name,
          avatar_url,
          created_at
        )
      `)
      .eq('organization_id', orgId)

    if (!error && data) {
      setTeam(data.map((m: any) => m.profiles) as Profile[])
    } else if (error) {
      console.error("Error fetching team:", error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTeam()
  }, [orgId])

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Workspace</h1>
          <p className="text-muted text-sm mt-1">Manage developers and organization roles.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <UserPlus size={16} strokeWidth={2.5} /> Invite Member
        </button>
      </div>

      {isInviteModalOpen && (
        <InviteModal 
          orgId={orgId} 
          onClose={() => setIsInviteModalOpen(false)}
          onInviteSent={() => {
            fetchTeam()
            setIsInviteModalOpen(false)
          }}
        />
      )}

      <div className="flex flex-col md:flex-row gap-3 bg-card p-2 rounded-lg border border-border">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full bg-accent/50 border-none rounded-md pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary placeholder:text-muted/60"
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-accent border-border text-[12px] rounded-md px-3 py-1.5 font-medium hover:bg-accent/80 transition-colors border">
            Filter: All Roles
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1 max-w-[200px]">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <div className="hidden md:flex flex-1 justify-center">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="hidden md:block flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex-1 flex justify-end">
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 border-b border-border">
                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">Developer</th>
                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest text-center">Role</th>
                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">Joined</th>
                    <th className="p-4 text-[10px] font-bold text-muted uppercase tracking-widest">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-accent/10 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${member.avatar_url ? '' : 'bg-primary/10 text-primary border-primary/20'}`}>
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(member.email)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{member.full_name || 'No Name Set'}</p>
                            <p className="text-[11px] text-muted flex items-center gap-1.5">
                              <Mail size={10} /> {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-[10px] font-bold text-purple-400 uppercase tracking-tight">
                            <Shield size={10} /> Member
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={12} />
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500/80">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          ONLINE
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-muted/40 hover:text-foreground p-1 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-border/40">
              {team.map((member) => (
                <div key={member.id} className="p-4 space-y-4 hover:bg-accent/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${member.avatar_url ? '' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(member.email)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{member.full_name || 'No Name Set'}</p>
                        <p className="text-[11px] text-muted">{member.email}</p>
                      </div>
                    </div>
                    <button className="text-muted/40 p-1">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-[10px] font-bold text-purple-400 uppercase tracking-tight">
                      <Shield size={10} /> Member
                    </span>
                    <div className="flex items-center gap-4 text-[11px] font-medium text-muted">
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={10} /> {new Date(member.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ONLINE
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-2 bg-accent/30 border border-border/40 rounded-lg text-[11px] font-bold text-muted flex items-center justify-center gap-2 hover:bg-accent/50 transition-colors">
                    PROFILE DETAILS <ExternalLink size={10} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="bg-accent/10 rounded-xl border border-border p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">Access Control</h3>
            <p className="text-[12px] text-muted">Set permissions and roles for your team members.</p>
          </div>
        </div>
        <button className="w-full md:w-auto px-4 py-2 bg-accent hover:bg-accent/80 border border-border rounded-md text-[12px] font-bold text-foreground transition-all">
          MANAGE ROLES
        </button>
      </div>
    </div>
  )
}