"use client"

import { useState, type FormEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Zap, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Sprint = {
  id: number
  name: string
  goal: string | null
  start_date: string
  end_date: string
  organization_id: string
}

export default function EditSprintModal({
  sprint,
  projectId,
  onClose,
  onSaved
}: {
  sprint: Sprint
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(sprint.name)
  const [goal, setGoal] = useState(sprint.goal || '')
  const [startDate, setStartDate] = useState(sprint.start_date)
  const [endDate, setEndDate] = useState(sprint.end_date)
  const [isSaving, setIsSaving] = useState(false)
  
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    setIsSaving(true)
    const { error } = await supabase
      .from('sprints')
      .update({
        name: name.trim(),
        goal: goal.trim() || null,
        start_date: startDate,
        end_date: endDate
      })
      .eq('id', sprint.id)
      .eq('project_id', projectId)

    setIsSaving(false)

    if (error) {
      toast.error(`Could not update sprint: ${error.message}`)
      return
    }

    toast.success(`Sprint "${name}" updated successfully`)
    onSaved()
    onClose()
  }

  const isUnchanged =
    name.trim() === sprint.name &&
    (goal.trim() || null) === sprint.goal &&
    startDate === sprint.start_date &&
    endDate === sprint.end_date

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap size={20} className="text-primary" /> Edit Sprint
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
          <div className="space-y-1.5">
            <label htmlFor="editSprintName" className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint Name</label>
            <input 
              id="editSprintName"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Infrastructure Overhaul"
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40 shadow-inner" 
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="editSprintGoal" className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint Goal</label>
            <textarea 
              id="editSprintGoal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[80px] placeholder:text-muted/40 shadow-inner"
              placeholder="What is the key outcome of this cycle?"
              rows={2}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="editSprintStart" className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Start Date</label>
              <div className="relative">
                <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  id="editSprintStart"
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="editSprintEnd" className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">End Date</label>
              <div className="relative">
                <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  id="editSprintEnd"
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
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
              disabled={isSaving || isUnchanged || !name.trim()}
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
