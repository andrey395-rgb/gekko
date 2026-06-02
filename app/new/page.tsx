"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Zap, Building2, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 1. Create Organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: name.trim() }])
        .select()
        .single()

      if (orgError) throw orgError

      // 2. Add as Owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: org.id,
          profile_id: session.user.id,
          role: 'owner'
        }])

      if (memberError) throw memberError

      toast.success('Workspace created successfully!')
      router.push(`/${org.id}`)
    } catch (error: any) {
      console.error('Error creating workspace:', error)
      toast.error(error.message || 'Failed to create workspace')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Zap size={24} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Create a new workspace</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Setup your team's home base</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Workspace Name</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Engineering"
                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:bg-accent/40 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/30"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-accent shadow-lg shadow-primary/10 active:scale-[0.98] group"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Build Workspace
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-10 border-t border-border/50 text-center">
          <button 
            onClick={() => router.back()}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  )
}
