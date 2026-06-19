"use client"

import { useState, type FormEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Project = {
  id: string
  organization_id: string
  name: string
  description?: string | null
  created_at?: string
}

export default function RenameProjectModal({
  project,
  orgId,
  onClose,
  onRenamed
}: {
  project: Project
  orgId: string
  onClose: () => void
  onRenamed: (project: Project) => void
}) {
  const [name, setName] = useState(project.name)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName === project.name) return

    setIsSaving(true)
    const { data, error } = await supabase
      .from('projects')
      .update({ name: trimmedName })
      .eq('id', project.id)
      .eq('organization_id', orgId)
      .select()
      .single()

    setIsSaving(false)

    if (error) {
      toast.error(`Could not rename project: ${error.message}`)
      return
    }

    if (data) {
      toast.success(`Project renamed to "${data.name}"`)
      onRenamed(data)
      onClose()
    }
  }

  const isUnchanged = name.trim() === project.name || !name.trim()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Pencil size={18} className="text-primary" /> Rename Project
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSaving}
            className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="renameProjectName" className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">
              Project Name
            </label>
            <input 
              id="renameProjectName"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..." 
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
              autoFocus
              required
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-border bg-card hover:bg-accent rounded-lg text-xs font-bold transition-all text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUnchanged}
              className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
