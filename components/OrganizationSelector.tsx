"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Building2, ChevronDown, Check, Plus, Globe } from 'lucide-react'

export default function OrganizationSelector() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const currentOrgId = params?.orgId as string | undefined
  const [organizations, setOrganizations] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, name)')
        .eq('profile_id', user.id)

      if (data) {
        // Filter out null organizations and map
        setOrganizations(data.filter(item => item.organizations).map(item => item.organizations))
      }
    }
    fetchOrgs()
  }, [supabase, pathname]) // Refresh on navigation

  const currentOrg = organizations.find(org => org.id === currentOrgId)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold border shadow-sm active:scale-95 ${
          isOpen 
            ? 'bg-accent text-foreground border-primary/50 ring-1 ring-primary/20' 
            : 'bg-card text-muted hover:text-foreground border-border hover:border-primary/30 hover:bg-accent/50'
        }`}
      >
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Building2 size={12} strokeWidth={2.5} />
        </div>
        <span className="max-w-[140px] truncate uppercase tracking-tight">{currentOrg?.name || 'Select Workspace'}</span>
        <ChevronDown size={14} className={`text-muted/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-[240px] bg-card border border-border rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 text-[10px] font-bold text-muted/60 uppercase tracking-widest border-b border-border/50 mb-1 flex items-center justify-between">
              Your Workspaces
              <Globe size={10} />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto px-1">
              {organizations.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-[11px] text-muted italic">No workspaces found</p>
                </div>
              ) : (
                organizations.map(org => {
                  const isActive = org.id === currentOrgId
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        setIsOpen(false)
                        router.push(`/${org.id}`)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg transition-all text-left group mb-0.5 ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-bold' 
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent text-muted border-border group-hover:border-primary/30'
                      }`}>
                        {org.name[0].toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{org.name}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className="border-t border-border/50 mt-1 pt-2 px-1">
              <button 
                onClick={() => {
                  setIsOpen(false)
                  router.push('/')
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-muted hover:text-foreground hover:bg-accent rounded-lg transition-all text-left"
              >
                <div className="w-6 h-6 rounded border border-dashed border-border flex items-center justify-center shrink-0 text-muted/60">
                  <Plus size={14} />
                </div>
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
