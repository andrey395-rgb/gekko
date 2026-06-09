"use client"

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
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
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
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

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setIsOAuthLoading(provider)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ''}`,
      },
    })

    if (error) {
      setError(error.message)
      setIsOAuthLoading(null)
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
            We&apos;ve sent an activation link to <span className="text-foreground font-bold">{email}</span>.
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted font-bold tracking-widest">Or continue with social</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={!!isOAuthLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-accent/50 hover:bg-accent border border-border rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isOAuthLoading === 'github' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.805.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            )}
            GitHub
          </button>
          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={!!isOAuthLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-accent/50 hover:bg-accent border border-border rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isOAuthLoading === 'google' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Google
          </button>
        </div>
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