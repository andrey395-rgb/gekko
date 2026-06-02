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
  Building2
} from 'lucide-react'

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

  useEffect(() => {
    const fetchOrgData = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('name, github_owner, github_repo')
        .eq('id', orgId)
        .single()
      
      if (data) {
        setOrgData({
          name: data.name,
          github_owner: data.github_owner || '',
          github_repo: data.github_repo || ''
        })
      }
      setLoading(false)
    }

    fetchOrgData()
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
    } else {
      setMessage({ type: 'success', text: 'Settings updated successfully.' })
      setOrgData(trimmedData)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your organization's configuration and integrations.</p>
      </div>

      <div className="max-w-2xl">
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
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
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
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
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
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground">The specific repository name.</p>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md flex items-center gap-3 ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2 px-6 rounded-md transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
