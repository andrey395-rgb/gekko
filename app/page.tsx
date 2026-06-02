"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Zap } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndOrgs = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      // Check if user has any organizations
      const { data: orgs, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('profile_id', session.user.id)
        .limit(1)

      if (error) {
        console.error("Error checking organizations:", error)
        setIsLoading(false)
        return
      }

      if (orgs && orgs.length > 0) {
        router.replace(`/${orgs[0].organization_id}`)
      } else {
        router.replace('/new')
      }
    }

    checkUserAndOrgs()
  }, [router, supabase])

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="w-12 h-12 bg-emerald-500 rounded flex items-center justify-center animate-pulse mb-4">
        <Zap size={24} className="text-black fill-current" />
      </div>
      <p className="text-sm font-medium text-muted animate-pulse">Initializing Workspace...</p>
    </div>
  )
}
