"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type Ticket = {
  id: number
  title: string
  type: string
  priority: string
  status: string
}

export default function TicketsPage() {
  const columns = ['Open', 'In Progress', 'Review', 'Closed']
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Task')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Open')
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  // NEW: State to track which ticket is currently being dragged
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null)
  
  const supabase = createClient()

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setTickets(data)
  }

  useEffect(() => { fetchTickets() }, [])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('tickets').insert([{ title, type, priority, status }])
    if (!error) {
      setTitle('')
      setIsModalOpen(false)
      fetchTickets() 
    }
  }

  // NEW: Handle the drop event
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault() // Required to allow dropping
    
    if (!draggedTicketId) return

    // 1. Optimistically update the UI instantly so it feels blazing fast
    setTickets(tickets.map(t => 
      t.id === draggedTicketId ? { ...t, status: newStatus } : t
    ))

    // 2. Update the database silently in the background
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', draggedTicketId)

    if (error) {
      alert(`Failed to update ticket: ${error.message}`)
      fetchTickets() // Revert UI if DB fails
    }
    
    setDraggedTicketId(null)
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500">Manage and track your sprint tasks.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + New Ticket
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTickets = tickets.filter(ticket => ticket.status === column)

          return (
            <div 
              key={column} 
              className="flex-none w-80 bg-gray-100/50 rounded-lg flex flex-col transition-colors"
              // NEW: Drag and Drop event listeners on the column
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">{column}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full">
                  {columnTickets.length}
                </span>
              </div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {columnTickets.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 text-sm">
                    Drop tickets here
                  </div>
                ) : (
                  columnTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      // NEW: Make the card draggable and track when drag starts
                      draggable
                      onDragStart={() => setDraggedTicketId(ticket.id)}
                      className="bg-white p-4 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                          {ticket.type}
                        </span>
                        <span className="text-xs text-gray-400">#{ticket.id}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 line-clamp-2">{ticket.title}</h4>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Priority: {ticket.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* New Ticket Modal Overlay (Unchanged) */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Form fields omitted for brevity, keep what you had! */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                    <option value="Bug">Bug</option>
                    <option value="Feature">Feature</option>
                    <option value="Task">Task</option>
                    <option value="Question">Question</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}