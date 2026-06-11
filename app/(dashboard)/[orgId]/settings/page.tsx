"use client"

import { useState, useEffect, use as useReact } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Settings, 
  GitPullRequest, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Building2,
  Users,
  Shield,
  Trash2,
  UserPlus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import InviteModal from '@/components/InviteModal'

export default function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = useReact(params)
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [orgData, setOrgData] = useState({
    name: '',
    github_owner: '',
    github_repo: ''
  })

  const [members, setMembers] = useState<any[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    // Fetch Organization Data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, github_owner, github_repo')
      .eq('id', orgId)
      .single()
    
    if (org) {
      setOrgData({
        name: org.name,
        github_owner: org.github_owner || '',
        github_repo: org.github_repo || ''
      })
    }

    // Fetch Members and Roles
    const { data: membersData } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        profile_id,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
    
    if (membersData) {
      setMembers(membersData)
      const me = membersData.find(m => m.profile_id === user?.id)
      setCurrentUserRole(me?.role || null)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (orgId) {
      fetchData()
    }
  }, [orgId, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const trimmedData = {
      name: orgData.name.trim(),
      github_owner: orgData.github_owner.trim(),
      github_repo: orgData.github_repo.trim()
    }

    const { error } = await supabase
      .from('organizations')
      .update(trimmedData)
      .eq('id', orgId)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update settings.' })
      toast.error('Failed to update settings')
    } else {
      setMessage({ type: 'success', text: 'Settings updated successfully.' })
      toast.success('Settings updated successfully')
      setOrgData(trimmedData)
    }
    setSaving(false)
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)
    
    if (error) {
      toast.error('Failed to update role: ' + error.message)
    } else {
      toast.success('Role updated')
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m))
    }
  }

  const handleRemoveMember = async (memberId: string, profileName: string) => {
    if (!confirm(`Are you sure you want to remove ${profileName} from the workspace?`)) return

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
    
    if (error) {
      toast.error('Failed to remove member: ' + error.message)
    } else {
      toast.success('Member removed')
      setMembers(members.filter(m => m.id !== memberId))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const canManageRoles = currentUserRole === 'owner' || currentUserRole === 'admin'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your organization's configuration and team.</p>
      </div>

      <div className="max-w-4xl space-y-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-accent/5 flex items-center gap-2">
              <Building2 size={18} className="text-muted" />
              <h2 className="text-sm font-semibold text-foreground">General Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="orgName" className="text-xs font-medium text-muted uppercase tracking-wider">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-accent/5 flex items-center gap-2">
              <GitPullRequest size={18} className="text-muted" />
              <h2 className="text-sm font-semibold text-foreground">GitHub Integration</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-md p-3 mb-4">
                <p className="text-xs text-blue-500 leading-relaxed">
                  <strong>How this works:</strong> Gekko uses the public GitHub API to fetch open pull requests. 
                  This integration currently only supports <strong>public repositories</strong> and does not require 
                  authentication.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="githubOwner" className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1">
                    GitHub Owner
                  </label>
                  <input
                    id="githubOwner"
                    type="text"
                    placeholder="e.g. vercel"
                    value={orgData.github_owner}
                    onChange={(e) => setOrgData({ ...orgData, github_owner: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground">The user or organization name.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="githubRepo" className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1">
                    GitHub Repository
                  </label>
                  <input
                    id="githubRepo"
                    type="text"
                    placeholder="e.g. next.js"
                    value={orgData.github_repo}
                    onChange={(e) => setOrgData({ ...orgData, github_repo: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground">The specific repository name.</p>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md flex items-center gap-3 ${
              message.type === 'success' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2 px-6 rounded-md transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>

        {/* Collaboration / Team Roles Section */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-accent/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-muted" />
              <h2 className="text-sm font-semibold text-foreground">Team & Collaboration</h2>
            </div>
            {canManageRoles && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md flex items-center gap-2 transition-all border border-purple-500/20"
              >
                <UserPlus size={14} />
                Invite Member
              </button>
            )}
          </div>
          <div className="divide-y divide-border">
            {members.map((member) => {
              const isMe = member.profile_id === currentUserId
              return (
                <div key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold">
                      {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.profiles?.email?.[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        {member.profiles?.full_name || 'No Name'}
                        {isMe && <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-widest">You</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.profiles?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {canManageRoles && !isMe ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="bg-background border border-border rounded-md px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button 
                          onClick={() => handleRemoveMember(member.id, member.profiles?.full_name || member.profiles?.email)}
                          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                          title="Remove from workspace"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/50 border border-border rounded-full">
                        <Shield size={12} className={member.role === 'owner' ? 'text-purple-500' : 'text-muted-foreground'} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{member.role}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-4 bg-accent/5 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-2 uppercase tracking-[0.1em] font-medium">
              <Shield size={12} className="text-purple-500" /> Only Owners and Admins can manage team roles
            </p>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <InviteModal 
          orgId={orgId} 
          onClose={() => setIsInviteModalOpen(false)}
          onInviteSent={() => {
            fetchData()
            setIsInviteModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

