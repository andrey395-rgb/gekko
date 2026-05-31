"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh() 
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-bold text-muted hover:text-foreground bg-accent/50 hover:bg-accent border border-border px-3 py-1.5 rounded-md transition-all flex items-center gap-2 uppercase tracking-wider"
    >
      <LogOut size={14} /> Log out
    </button>
  )
}
