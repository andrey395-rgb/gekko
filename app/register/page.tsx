"use client"

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Zap, 
  User, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-[400px] w-full p-8 bg-card rounded-2xl border border-border shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500 relative z-10 mx-auto">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(62,207,142,0.2)] animate-bounce duration-1000">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Check your email</h2>
          <p className="text-sm text-muted leading-relaxed px-4">
            We've sent an activation link to <span className="text-foreground font-bold">{email}</span>.
          </p>
        </div>
        <div className="pt-4 border-t border-border/40">
          <Link 
            href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
            className="text-primary text-xs font-bold hover:underline flex items-center justify-center gap-2"
          >
            PROCEED TO LOGIN <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[400px] w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(62,207,142,0.1)] mb-6">
          <Zap size={24} className="text-primary fill-current" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase tracking-widest">
          GEKKO
        </h1>
        <p className="text-muted text-sm mt-2">Join the engineering elite.</p>
      </div>
      
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-2xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Create Account</h2>
          <p className="text-xs text-muted">Begin your journey towards zero-friction deployment.</p>
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2 animate-in shake-in duration-300">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-accent/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40"
                placeholder="Linus Torvalds"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-accent/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40"
                placeholder="linus@linux.org"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Secure Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-accent/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted/40"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <p className="text-[10px] text-muted/60 pl-1">Min. 6 characters recommended.</p>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> INITIALIZING...
              </>
            ) : (
              <>
                CREATE ACCOUNT <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-muted">
        Already have an account?{' '}
        <Link 
          href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
          className="text-primary font-bold hover:underline transition-colors"
        >
          SIGN IN
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted animate-pulse font-bold tracking-widest uppercase">Preparing Workspace...</p>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  )
}