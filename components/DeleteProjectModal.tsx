"use client"

import { useState, type FormEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter, useParams } from 'next/navigation'

type Project = {
  id: string
  organization_id: string
  name: string
  description?: string | null
  created_at?: string
}

export default function DeleteProjectModal({
  project,
  orgId,
  onClose,
  onDeleted
}: {
  project: Project
  orgId: string
  onClose: () => void
  onDeleted: (projectId: string) => void
}) {
  const [typedName, setTypedName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const currentProjectId = params?.projectId as string | undefined

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (typedName.trim() !== project.name) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)
      .eq('organization_id', orgId)

    setIsDeleting(false)

    if (error) {
      toast.error(`Could not delete project: ${error.message}`)
      return
    }

    toast.success(`Project "${project.name}" deleted successfully`)
    onDeleted(project.id)

    if (currentProjectId === project.id && orgId) {
      router.push(`/${orgId}`)
    } else {
      router.refresh()
    }
    onClose()
  }

  const isConfirmed = typedName.trim() === project.name

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Trash2 size={20} className="text-destructive" /> Delete Project
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isDeleting}
            className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning Banner */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-destructive">Warning: This action is permanent</span>
              <p className="text-[11px] text-muted leading-relaxed">
                Deleting <strong className="text-foreground">&quot;{project.name}&quot;</strong> will immediately delete all its tickets, comments, sprints, and associated details. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmProjectName" className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">
              Confirm by typing project name
            </label>
            <p className="text-[11px] text-muted pl-1">
              Type <strong className="text-foreground select-all">{project.name}</strong> to confirm:
            </p>
            <input 
              id="confirmProjectName"
              type="text" 
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={project.name}
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-destructive outline-none transition-all"
              autoFocus
              required
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-border bg-card hover:bg-accent rounded-lg text-xs font-bold transition-all text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || !isConfirmed}
              className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-destructive/10"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
