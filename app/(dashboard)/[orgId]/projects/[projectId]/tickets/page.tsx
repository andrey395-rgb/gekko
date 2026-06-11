"use client"

import { useState, useEffect, use as useReact } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { createClient } from '@/utils/supabase/client'
import ReactMarkdown from 'react-markdown'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  X, 
  Send,
  User as UserIcon,
  Tag,
  AlertTriangle,
  ChevronRight,
  GripVertical,
  Clock,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  ArrowRightLeft
} from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import { toast } from 'react-hot-toast'

type Profile = {
  id: string
  email: string
  full_name: string | null
}

type Ticket = {
  id: number
  title: string
  description: string | null 
  type: string
  priority: string
  status: string
  assignee_id: string | null
  sprint_id: number | null
  organization_id: string
  attachment_urls?: string[]
}

type Sprint = {
  id: number
  name: string
  status?: string
}

type Comment = {
  id: number
  content: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string
  }
}

type TicketSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode
  variant?: 'compact' | 'default'
}

function TicketSelect({ children, className = '', variant = 'default', ...props }: TicketSelectProps) {
  const sizeClass = variant === 'compact'
    ? 'py-1.5 pl-2.5 pr-8 text-[12px] rounded-md'
    : 'py-2.5 pl-3 pr-9 text-sm rounded-lg'

  return (
    <div className={`relative group ${className}`}>
      <select
        {...props}
        className={`w-full bg-accent/50 border border-border text-foreground font-medium ${sizeClass} focus:ring-1 focus:ring-primary focus:border-primary/60 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors shadow-sm [&>option]:bg-card [&>option]:text-foreground`}
      >
        {children}
      </select>
      <ChevronRight
        size={variant === 'compact' ? 10 : 14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-muted pointer-events-none group-hover:text-primary transition-colors"
      />
    </div>
  )
}

export default function TicketsPage({ params }: { params: Promise<{ orgId: string, projectId: string }> }) {
  const { orgId, projectId } = useReact(params)
  const columns = ['Open', 'In Progress', 'Review', 'Closed']
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('') 
  const [type, setType] = useState('Task')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Open')
  const [assigneeId, setAssigneeId] = useState<string>('unassigned')
  const [sprintId, setSprintId] = useState<string>('none')
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [team, setTeam] = useState<Profile[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null)
  
  const [filterType, setFilterType] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterSprintId, setFilterSprintId] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const [user, setUser] = useState<any>(null)
  const [transferMessage, setTransferMessage] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (ticketsData) setTickets(ticketsData)

    const { data: teamData } = await supabase
      .from('organization_members')
      .select('profiles(id, email, full_name)')
      .eq('organization_id', orgId)
    
    if (teamData) {
      setTeam(teamData.map((m: any) => m.profiles) as Profile[])
    }

    const { data: sprintsData } = await supabase
      .from('sprints')
      .select('id, name')
      .eq('project_id', projectId)
      .order('start_date', { ascending: false })
    
    if (sprintsData) setSprints(sprintsData)

    setIsLoading(false)
  }

  useEffect(() => { fetchData() }, [orgId, projectId])

  useEffect(() => {
    if (!isLoading && tickets.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const idParam = params.get('id')
      if (idParam) {
        const ticketId = parseInt(idParam, 10)
        const ticket = tickets.find(t => t.id === ticketId)
        if (ticket && !selectedTicket) {
          handleTicketClick(ticket)
          // Clean up the URL so it doesn't re-open on refresh
          window.history.replaceState({}, '', window.location.pathname)
        }
      }
    }
  }, [isLoading, tickets, selectedTicket])

  const fetchComments = async (ticketId: number) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, email)') 
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    if (data) setComments(data as any)
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    fetchComments(ticket.id)
  }

  const toggleTicketSelection = (ticketId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedTicketIds(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId) 
        : [...prev, ticketId]
    )
  }

  const handleBulkSprintUpdate = async (newSprintId: string) => {
    if (selectedTicketIds.length === 0) return
    const sprintVal = newSprintId === 'none' ? null : parseInt(newSprintId)
    
    const { error } = await supabase
      .from('tickets')
      .update({ sprint_id: sprintVal })
      .in('id', selectedTicketIds)

    if (error) {
      toast.error('Failed to bulk update sprint')
    } else {
      toast.success(`Updated ${selectedTicketIds.length} tickets`)
      setTickets(tickets.map(t => selectedTicketIds.includes(t.id) ? { ...t, sprint_id: sprintVal } : t))
      setSelectedTicketIds([])
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedTicketIds.length === 0) return
    
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .in('id', selectedTicketIds)

    if (error) {
      toast.error('Failed to bulk update status')
    } else {
      toast.success(`Updated ${selectedTicketIds.length} tickets`)
      setTickets(tickets.map(t => selectedTicketIds.includes(t.id) ? { ...t, status: newStatus } : t))
      setSelectedTicketIds([])
    }
  }

  const handleBulkPriorityUpdate = async (newPriority: string) => {
    if (selectedTicketIds.length === 0) return
    
    const { error } = await supabase
      .from('tickets')
      .update({ priority: newPriority })
      .in('id', selectedTicketIds)

    if (error) {
      toast.error('Failed to bulk update priority')
    } else {
      toast.success(`Updated ${selectedTicketIds.length} tickets`)
      setTickets(tickets.map(t => selectedTicketIds.includes(t.id) ? { ...t, priority: newPriority } : t))
      setSelectedTicketIds([])
    }
  }

  const handleUpdateSprint = async (newSprintId: string) => {
    if (!selectedTicket) return
    const sprintVal = newSprintId === 'none' ? null : parseInt(newSprintId)
    const { error } = await supabase
      .from('tickets')
      .update({ sprint_id: sprintVal })
      .eq('id', selectedTicket.id)

    if (error) {
      toast.error('Failed to update sprint')
    } else {
      toast.success('Sprint updated')
      setSelectedTicket({ ...selectedTicket, sprint_id: sprintVal })
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, sprint_id: sprintVal } : t))
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !selectedTicket) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('comments')
      .insert([{ ticket_id: selectedTicket.id, author_id: session.user.id, content: newComment }])

    if (!error) {
      setNewComment('')
      fetchComments(selectedTicket.id)
    }
  }

  const handleClaimTicket = async () => {
    if (!selectedTicket || !user) return
    const { error } = await supabase
      .from('tickets')
      .update({ assignee_id: user.id })
      .eq('id', selectedTicket.id)

    if (error) {
      toast.error('Failed to claim ticket')
    } else {
      toast.success('Ticket claimed!')
      setSelectedTicket({ ...selectedTicket, assignee_id: user.id })
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, assignee_id: user.id } : t))
    }
  }

  const handleUnassignTicket = async () => {
    if (!selectedTicket) return
    const { error } = await supabase
      .from('tickets')
      .update({ assignee_id: null })
      .eq('id', selectedTicket.id)

    if (error) {
      toast.error('Failed to unassign')
    } else {
      toast.success('Unassigned from ticket')
      setSelectedTicket({ ...selectedTicket, assignee_id: null })
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, assignee_id: null } : t))
    }
  }

  const handleInitiateTransfer = async () => {
    if (!selectedTicket || !user || !transferTargetId) {
      toast.error('Please select a teammate')
      return
    }
    setIsTransferring(true)
    const { error } = await supabase
      .from('ticket_transfers')
      .insert([{
        ticket_id: selectedTicket.id,
        from_user_id: user.id,
        to_user_id: transferTargetId,
        message: transferMessage || null
      }])

    if (error) {
      if (error.code === '23505') {
        toast.error('A transfer request is already pending for this ticket')
      } else {
        toast.error('Failed to send transfer request')
      }
    } else {
      toast.success('Transfer request sent!')
      setTransferMessage('')
      setTransferTargetId('')
    }
    setIsTransferring(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newUrls = [...attachmentUrls]

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${orgId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) {
        toast.error(`Error uploading ${file.name}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      newUrls.push(publicUrl)
    }

    setAttachmentUrls(newUrls)
    setIsUploading(false)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    const newTicket = { 
      organization_id: orgId,
      project_id: projectId,
      title, 
      description: description || null, 
      type, 
      priority, 
      status, 
      assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
      sprint_id: sprintId === 'none' ? null : parseInt(sprintId),
      attachment_urls: attachmentUrls
    }
    const { error } = await supabase.from('tickets').insert([newTicket])
    if (!error) {
      setTitle('')
      setDescription('') 
      setAssigneeId('unassigned')
      setSprintId('none')
      setAttachmentUrls([])
      setIsModalOpen(false)
      fetchData() 
      toast.success('Ticket created successfully')
    } else {
      toast.error('Failed to create ticket')
    }
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedTicketId) return
    
    const originalTickets = [...tickets]
    setTickets(tickets.map(t => t.id === draggedTicketId ? { ...t, status: newStatus } : t))
    
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', draggedTicketId)
    if (error) {
      setTickets(originalTickets)
      toast.error('Failed to update ticket status')
    } else {
      toast.success(`Moved to ${newStatus}`)
    }
    setDraggedTicketId(null)
  }

  const getAssigneeInitials = (id: string | null) => {
    if (!id) return null
    const member = team.find(m => m.id === id)
    if (!member) return null
    return (member.full_name || member.email).substring(0, 2).toUpperCase()
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'High': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-muted bg-accent border-border'
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tickets</h1>
          <p className="text-muted text-sm mt-1">Manage and track your team's development tasks.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} /> New Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-card p-2 rounded-lg border border-border">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-accent/50 border-none rounded-md pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary placeholder:text-muted/60"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider pl-2">Sprint</span>
            <TicketSelect
              value={filterSprintId}
              onChange={(e) => setFilterSprintId(e.target.value)}
              variant="compact"
              className="min-w-[120px]"
            >
                <option value="All">All Sprints</option>
                <option value="none">Backlog Only</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id.toString()}>{s.name}</option>
                ))}
            </TicketSelect>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider pl-2">Type</span>
            <TicketSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              variant="compact"
              className="min-w-[100px]"
            >
                <option value="All">All Types</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="Task">Task</option>
            </TicketSelect>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider pl-2">Priority</span>
            <TicketSelect
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              variant="compact"
              className="min-w-[100px]"
            >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </TicketSelect>
          </div>
          {(filterType !== 'All' || filterPriority !== 'All' || filterSprintId !== 'All') && (
            <button 
              onClick={() => { setFilterType('All'); setFilterPriority('All'); setFilterSprintId('All') }} 
              className="text-[11px] text-purple-500 font-bold hover:underline px-2 shrink-0"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-4 min-w-full">
          {columns.map((column) => {
          const columnTickets = tickets.filter(ticket => 
            ticket.status === column && 
            (filterType === 'All' || ticket.type === filterType) && 
            (filterPriority === 'All' || ticket.priority === filterPriority) &&
            (filterSprintId === 'All' || 
              (filterSprintId === 'none' ? ticket.sprint_id === null : ticket.sprint_id?.toString() === filterSprintId)
            ) &&
            (searchQuery.trim() === '' || 
              ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              ticket.id.toString().includes(searchQuery)
            )
          )
          return (
            <div 
              key={column} 
              className="flex-1 min-w-[280px] sm:min-w-[320px] flex flex-col rounded-lg bg-accent/20 border border-transparent hover:border-border transition-colors group"
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="p-3 border-b border-border/40 flex justify-between items-center bg-accent/10">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">{column}</h3>
                  <span className="bg-accent text-muted text-[10px] font-bold py-0.5 px-2 rounded-full border border-border">
                    {columnTickets.length}
                  </span>
                </div>
                <MoreVertical size={14} className="text-muted/40 group-hover:text-muted cursor-pointer transition-colors" />
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card/50 p-3 rounded-lg border border-border/50 space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  ))
                ) : columnTickets.length === 0 ? (
                  <div className="h-20 border border-dashed border-border/60 rounded-lg flex items-center justify-center text-muted/40 text-[11px] font-medium italic">
                    No tickets in {column}
                  </div>
                ) : (
                  columnTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      draggable 
                      onDragStart={() => setDraggedTicketId(ticket.id)} 
                      onClick={() => handleTicketClick(ticket)}
                      className={`bg-card p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-accent/30 transition-all group/card relative ${selectedTicketIds.includes(ticket.id) ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`transition-all duration-300 transform ${selectedTicketIds.includes(ticket.id) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100'}`}>
                            <input 
                              type="checkbox" 
                              checked={selectedTicketIds.includes(ticket.id)}
                              onChange={() => toggleTicketSelection(ticket.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded-md border-white/30 border-2 bg-black checked:bg-white checked:border-white accent-white focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all appearance-none"
                            />
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priority)} uppercase tracking-tighter transition-transform duration-300 ${!selectedTicketIds.includes(ticket.id) ? 'group-hover/card:translate-x-0 -translate-x-6' : ''}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted font-mono opacity-40 group-hover/card:opacity-100 transition-opacity">#{ticket.id}</span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover/card:text-primary transition-colors">{ticket.title}</h4>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Tag size={12} className="text-muted" />
                          <span className="text-[11px] text-muted font-medium">{ticket.type}</span>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${ticket.assignee_id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent text-muted/40 border-border border-dashed'}`}>
                          {getAssigneeInitials(ticket.assignee_id) || <UserIcon size={10} />}
                        </div>
                      </div>
                      
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-20 transition-opacity">
                        <GripVertical size={14} className="text-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedTicketIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md text-foreground px-2 py-2 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 z-[90] animate-in fade-in zoom-in-95 slide-in-from-bottom-20 duration-500 [animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)] border border-border hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition-shadow">
          <div className="flex items-center gap-3 px-3 py-2 bg-accent/50 rounded-md border border-border group/select-count relative overflow-hidden">
            <div className={`bg-primary text-primary-foreground w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-transform duration-300 ${selectedTicketIds.length > 0 ? 'scale-110' : 'scale-100'}`}>
              {selectedTicketIds.length}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">Selected</span>
            <button 
              onClick={() => setSelectedTicketIds([])}
              className="ml-auto sm:ml-2 p-1 text-muted hover:text-foreground hover:bg-accent rounded-md transition-colors group"
              title="Clear Selection"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <TicketSelect
              onChange={(e) => handleBulkSprintUpdate(e.target.value)}
              value=""
              variant="compact"
              className="min-w-[136px]"
            >
                <option value="" disabled>MOVE TO SPRINT</option>
                <option value="none">BACKLOG</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                ))}
            </TicketSelect>

            <TicketSelect
              onChange={(e) => handleBulkStatusUpdate(e.target.value)}
              value=""
              variant="compact"
              className="min-w-[128px]"
            >
                <option value="" disabled>SET STATUS</option>
                {columns.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
            </TicketSelect>

            <TicketSelect
              onChange={(e) => handleBulkPriorityUpdate(e.target.value)}
              value=""
              variant="compact"
              className="min-w-[128px]"
            >
                <option value="" disabled>SET PRIORITY</option>
                <option value="Critical">CRITICAL</option>
                <option value="High">HIGH</option>
                <option value="Medium">MEDIUM</option>
                <option value="Low">LOW</option>
            </TicketSelect>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal (Full-screen sheet on mobile) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] sm:rounded-xl border-t sm:border border-border flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20 shrink-0">
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(selectedTicket.priority)} uppercase`}>
                  {selectedTicket.priority}
                </span>
                <span className="text-xs text-muted font-mono">TICKET-{selectedTicket.id}</span>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Main Content */}
              <div className="flex-1 p-6 space-y-8 border-r border-border/40">
                <div>
                  <h2 className="text-2xl font-bold text-foreground leading-tight">{selectedTicket.title}</h2>
                  <div className="mt-4 flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-widest">Type</span>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Tag size={14} className="text-primary" /> {selectedTicket.type}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-widest">Status</span>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {selectedTicket.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    Description
                  </h3>
                  <div className="bg-accent/30 p-4 rounded-lg border border-border/40 text-[13px] leading-relaxed text-foreground/80 prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-border/40 prose-code:text-primary">
                    {selectedTicket.description ? (
                      <ReactMarkdown>{selectedTicket.description}</ReactMarkdown>
                    ) : (
                      <p className="text-muted italic opacity-50">No description provided for this ticket.</p>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                {selectedTicket.attachment_urls && selectedTicket.attachment_urls.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                      Attachments
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedTicket.attachment_urls.map((url, i) => (
                        <button 
                          key={i} 
                          onClick={() => setPreviewImageUrl(url)}
                          className="group relative aspect-video rounded-lg border border-border overflow-hidden bg-accent/20 hover:border-primary/50 transition-all shadow-sm text-left"
                        >
                          <img 
                            src={url} 
                            alt={`Attachment ${i + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon size={20} className="text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-border/20">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Activity</h3>
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center bg-accent/10 rounded-lg border border-dashed border-border/40">
                        <Send size={24} className="text-muted/20 mb-2" />
                        <p className="text-xs text-muted/60">No comments yet. Be the first to chime in!</p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-[10px] font-bold text-muted shrink-0 mt-0.5">
                            {(comment.profiles?.full_name || comment.profiles?.email || '?').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {comment.profiles?.full_name || comment.profiles?.email}
                              </span>
                              <span className="text-[10px] text-muted opacity-40">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="bg-accent/20 p-3 rounded-lg border border-border/40 text-xs text-foreground/70 prose prose-invert prose-xs max-w-none">
                              <ReactMarkdown>{comment.content}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <form onSubmit={handleAddComment} className="flex gap-2 pt-4 group">
                    <div className="flex-1 relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-accent/50 border border-border rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary outline-none min-h-[80px] transition-all placeholder:text-muted/40"
                        required
                      />
                      <button 
                        type="submit" 
                        className="absolute right-2 bottom-2 bg-primary text-primary-foreground p-1.5 rounded-md hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg"
                        disabled={!newComment.trim()}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-[280px] bg-accent/10 p-6 space-y-8 shrink-0">
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase font-bold text-muted tracking-widest">Assignee</h3>
                  <div className="flex items-center gap-3 p-2 bg-card rounded-lg border border-border shadow-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${selectedTicket.assignee_id ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(62,207,142,0.1)]' : 'bg-accent text-muted/40 border-border border-dashed'}`}>
                      {getAssigneeInitials(selectedTicket.assignee_id) || <UserIcon size={12} />}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-bold text-foreground">
                        {team.find(m => m.id === selectedTicket.assignee_id)?.full_name || team.find(m => m.id === selectedTicket.assignee_id)?.email || 'Unassigned'}
                      </span>
                      <span className="text-[10px] text-muted">Core Contributor</span>
                    </div>
                  </div>

                  <h3 className="text-[10px] uppercase font-bold text-muted tracking-widest pt-2">Sprint</h3>
                  <TicketSelect
                    value={selectedTicket.sprint_id || 'none'}
                    onChange={(e) => handleUpdateSprint(e.target.value)}
                    variant="compact"
                  >
                      <option value="none">No Sprint (Backlog)</option>
                      {sprints.map(sprint => (
                        <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                      ))}
                  </TicketSelect>

                  {/* Self-assignment / Unassignment */}
                  {selectedTicket.assignee_id === null ? (
                    <button 
                      onClick={handleClaimTicket}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-all border border-primary/20"
                    >
                      <UserIcon size={14} /> Claim This Ticket
                    </button>
                  ) : selectedTicket.assignee_id === user?.id ? (
                    <button 
                      onClick={handleUnassignTicket}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                    >
                      <X size={14} /> Unassign Me
                    </button>
                  ) : null}

                  {/* Delegation UI */}
                  {selectedTicket.assignee_id === user?.id && (
                    <div className="pt-4 space-y-3 border-t border-border/20">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase font-bold text-muted tracking-widest">Delegate Ticket</h3>
                        <ArrowRightLeft size={12} className="text-muted/40" />
                      </div>
                      <div className="space-y-2">
                        <TicketSelect
                          value={transferTargetId}
                          onChange={(e) => setTransferTargetId(e.target.value)}
                          variant="compact"
                        >
                            <option value="">Select teammate...</option>
                            {team.filter(m => m.id !== user?.id).map(member => (
                              <option key={member.id} value={member.id}>{member.full_name || member.email}</option>
                            ))}
                        </TicketSelect>
                        <textarea 
                          value={transferMessage}
                          onChange={(e) => setTransferMessage(e.target.value)}
                          placeholder="Add an optional message..."
                          className="w-full bg-accent/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none min-h-[60px] resize-none placeholder:text-muted/40"
                        />
                        <button 
                          onClick={handleInitiateTransfer}
                          disabled={isTransferring || !transferTargetId}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                        >
                          {isTransferring ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          Send Transfer Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase font-bold text-muted tracking-widest">Metadata</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/40">
                      <span className="text-[11px] text-muted flex items-center gap-2"><Clock size={12} /> Created</span>
                      <span className="text-[11px] font-medium text-foreground">Today</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/40">
                      <span className="text-[11px] text-muted flex items-center gap-2"><AlertTriangle size={12} /> Blockers</span>
                      <span className="text-[11px] font-medium text-muted">None</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Ticket Modal (Full-screen sheet on mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-lg h-[95vh] sm:h-auto sm:rounded-xl border-t sm:border border-border flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/20 shrink-0">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Plus size={20} className="text-primary" /> Create Ticket</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-muted hover:text-foreground p-1.5 hover:bg-accent rounded-md transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Ticket Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="What needs to be done?"
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40 shadow-inner" 
                  required 
                />
              </div>
              
                <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Description (Markdown)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[120px] placeholder:text-muted/40 shadow-inner"
                  placeholder="Details, reproduction steps, etc..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Type</label>
                  <TicketSelect
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                      <option value="Bug">Bug</option>
                      <option value="Feature">Feature</option>
                      <option value="Task">Task</option>
                  </TicketSelect>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Priority</label>
                  <TicketSelect
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                  </TicketSelect>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Assignee</label>
                  <TicketSelect
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                      <option value="unassigned">Unassigned</option>
                      {team.map(member => (
                        <option key={member.id} value={member.id}>{member.full_name || member.email}</option>
                      ))}
                  </TicketSelect>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">Sprint</label>
                  <TicketSelect
                    value={sprintId}
                    onChange={(e) => setSprintId(e.target.value)}
                  >
                      <option value="none">No Sprint (Backlog)</option>
                      {sprints.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </TicketSelect>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1 flex items-center gap-2">
                  <Paperclip size={12} /> Attachments
                </label>
                
                <div className="grid grid-cols-4 gap-2">
                  {attachmentUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-accent/20 group">
                      <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setAttachmentUrls(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  
                  <label className="aspect-square rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <>
                        <Plus size={16} className="text-muted group-hover:text-primary transition-colors" />
                        <span className="text-[9px] font-bold text-muted uppercase tracking-tighter mt-1 group-hover:text-primary transition-colors">Add Image</span>
                      </>
                    )}
                  </label>
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
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lightbox Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-md"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
            onClick={() => setPreviewImageUrl(null)}
          >
            <X size={32} />
          </button>
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            />
          </div>
        </div>
      )}
    </div>
  )
}
