"use client"

import { useState, type FormEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Sprint = {
  id: number
  name: string
  goal: string | null
  start_date: string
  end_date: string
  organization_id: string
}

export default function DeleteSprintModal({
  sprint,
  projectId,
  onClose,
  onDeleted
}: {
  sprint: Sprint
  projectId: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [typedName, setTypedName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (typedName.trim() !== sprint.name) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', sprint.id)
      .eq('project_id', projectId)

    setIsDeleting(false)

    if (error) {
      toast.error(`Could not delete sprint: ${error.message}`)
      return
    }

    toast.success(`Sprint "${sprint.name}" deleted successfully`)
    onDeleted()
    onClose()
  }

  const isConfirmed = typedName.trim() === sprint.name

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Trash2 size={20} className="text-destructive" /> Delete Sprint
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
                Deleting <strong className="text-foreground">&quot;{sprint.name}&quot;</strong> will permanently delete this sprint period. Associated tickets will NOT be deleted, but they will be moved back to the backlog.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmSprintName" className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">
              Confirm by typing sprint name
            </label>
            <p className="text-[11px] text-muted pl-1">
              Type <strong className="text-foreground select-all">{sprint.name}</strong> to confirm:
            </p>
            <input 
              id="confirmSprintName"
              type="text" 
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={sprint.name}
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
                'Delete Sprint'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
