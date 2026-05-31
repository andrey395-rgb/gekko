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
        // No organizations found - we should show a "Create Org" UI here or redirect to an onboarder
        setIsLoading(false)
      }
    }

    checkUserAndOrgs()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-12 h-12 bg-emerald-500 rounded flex items-center justify-center animate-pulse mb-4">
          <Zap size={24} className="text-black fill-current" />
        </div>
        <p className="text-sm font-medium text-muted animate-pulse">Initializing Workspace...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap size={32} className="text-black fill-current" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Gekko</h1>
          <p className="text-muted text-sm">You aren't a member of any organizations yet. Create one to get started.</p>
        </div>
        
        <div className="bg-card p-6 rounded-xl border border-border space-y-4">
          <button 
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
              
              const orgName = prompt("Organization Name:");
              if (!orgName) return;

              // 1. Create Org
              const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert([{ name: orgName }])
                .select()
                .single();
              
              if (orgError) {
                alert("Error creating org: " + orgError.message);
                return;
              }

              // 2. Add Member
              const { error: memError } = await supabase
                .from('organization_members')
                .insert([{ 
                  organization_id: org.id, 
                  profile_id: session.user.id,
                  role: 'owner' 
                }]);
              
              if (memError) {
                alert("Error adding member: " + memError.message);
                return;
              }

              router.push(`/${org.id}`);
            }}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all"
          >
            Create New Organization
          </button>
        </div>
      </div>
    </div>
  )
}
