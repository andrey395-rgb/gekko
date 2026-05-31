"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      <div className="max-w-[400px] w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(62,207,142,0.1)] mb-6 animate-in zoom-in-50 duration-500">
            <Zap size={24} className="text-primary fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase tracking-widest">
            GEKKO
          </h1>
          <p className="text-muted text-sm mt-2">Home base for high-velocity engineering.</p>
        </div>
        
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Sign In</h2>
            <p className="text-xs text-muted">Enter your credentials to access your workspace.</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2 animate-in shake-in duration-300">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Password</label>
                <button type="button" className="text-[10px] text-primary hover:underline font-bold">FORGOT?</button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> AUTHORIZING...
                </>
              ) : (
                <>
                  SIGN IN <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted">
          New to Gekko?{' '}
          <Link 
            href="/register" 
            className="text-primary font-bold hover:underline transition-colors"
          >
            CREATE ACCOUNT
          </Link>
        </p>
      </div>
    </div>
  )
}