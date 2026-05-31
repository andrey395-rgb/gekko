"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Zap, 
  Plus, 
  Calendar as CalendarIcon, 
  Target, 
  X,
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react'

type Sprint = {
  id: number
  name: string
  goal: string | null
  start_date: string
  end_date: string
}

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const supabase = createClient()

  const fetchSprints = async () => {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching sprints:', error)
    } else if (data) {
      setSprints(data)
    }
  }

  useEffect(() => {
    fetchSprints()
  }, [])

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('sprints')
      .insert([{ 
        name, 
        goal: goal || null,
        start_date: startDate, 
        end_date: endDate 
      }])

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setIsModalOpen(false)
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      fetchSprints()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sprints</h1>
          <p className="text-muted text-sm mt-1">Plan and track your team's development cycles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} /> New Sprint
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sprints.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-accent/20 border border-dashed border-border rounded-xl">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
              <Zap size={24} className="text-muted/40" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No cycles planned</h3>
            <p className="text-xs text-muted mt-1 max-w-[200px]">Start your first sprint to begin tracking progress.</p>
          </div>
        ) : (
          sprints.map((sprint) => (
            <div key={sprint.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:border-primary/40 transition-all group">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-500 uppercase">
                    <Zap size={10} className="fill-current" /> Active
                  </div>
                  <button className="text-muted hover:text-foreground">
                    <X size={14} />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{sprint.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                    <CalendarIcon size={12} />
                    {new Date(sprint.start_date).toLocaleDateString()} — {new Date(sprint.end_date).toLocaleDateString()}
                  </div>
                </div>

                {sprint.goal && (
                  <div className="bg-accent/30 p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                      <Target size={12} /> Goal
                    </div>
                    <p className="text-[12px] text-foreground/80 leading-relaxed italic">"{sprint.goal}"</p>
                  </div>
                )}
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted">
                    <span>Overall Progress</span>
                    <span className="text-emerald-500">0%</span>
                  </div>
                  <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-accent/20 border-t border-border flex justify-between items-center group-hover:bg-accent/30 transition-colors cursor-pointer">
                <span className="text-[11px] font-medium text-muted">View Sprint Board</span>
                <ChevronRight size={14} className="text-muted" />
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-md h-[95vh] sm:h-auto sm:rounded-xl border-t sm:border border-border flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20 shrink-0">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Zap size={20} className="text-primary" /> Plan Sprint</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSprint} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 Infrastructure Overhaul"
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40 shadow-inner" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint Goal</label>
                <textarea 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[80px] placeholder:text-muted/40 shadow-inner"
                  placeholder="What is the key outcome of this cycle?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Start Date</label>
                  <div className="relative">
                    <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">End Date</label>
                  <div className="relative">
                    <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground hover:bg-accent rounded-lg transition-all border border-transparent hover:border-border"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/10 active:scale-95"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}