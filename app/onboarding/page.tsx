"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  User, 
  Settings, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Zap, 
  Moon, 
  Sun,
  Bell
} from 'lucide-react'
import { submitProfile, submitPreferences } from './actions'
import { toast } from 'react-hot-toast'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  
  // Step 1 State
  const [fullName, setFullName] = useState('')
  
  // Step 2 State
  const [theme, setTheme] = useState('dark')
  const [notifications, setNotifications] = useState(true)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('full_name', fullName)
    
    startTransition(async () => {
      try {
        const result = await submitProfile(formData)
        if (result.error) {
          toast.error(result.error)
          return
        }
        setStep(2)
        toast.success('Profile updated!')
      } catch (error: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('theme', theme)
    formData.append('notifications', notifications ? 'on' : 'off')
    
    startTransition(async () => {
      try {
        const result = await submitPreferences(formData)
        if (result.error) {
          toast.error(result.error)
          return
        }
        setStep(3)
        toast.success('Preferences saved!')
      } catch (error: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  const handleFinish = () => {
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 overflow-hidden relative">
      <div className="max-w-[450px] w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(62,207,142,0.1)] mb-6">
            <Zap size={24} className="text-primary fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase tracking-widest">
            Welcome to Gekko
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  s === step ? 'w-8 bg-primary' : 'w-4 bg-muted'
                }`} 
              />
            ))}
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-2xl">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Set up your profile</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">Let your team know who you are. You can always change this later.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="e.g. Linus Torvalds"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isPending || !fullName.trim()}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <>NEXT STEP <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Personalize experience</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">Configure Gekko to match your preferred development workflow.</p>
              </div>

              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-accent/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background border border-border">
                          {theme === 'dark' ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-yellow-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Interface Theme</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Visual Preference</p>
                        </div>
                      </div>
                      <select 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="bg-background border border-border rounded-md text-xs font-bold px-2 py-1 outline-none"
                      >
                        <option value="dark">DARK</option>
                        <option value="light">LIGHT</option>
                      </select>
                    </div>

                    <div className="h-px bg-border/50" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <Bell size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Notifications</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Alerts & Updates</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNotifications(!notifications)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${notifications ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-background rounded-full transition-all duration-300 ${notifications ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <>SAVE PREFERENCES <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(62,207,142,0.2)]">
                <CheckCircle2 size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">You're all set!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">Your profile is configured and Gekko is ready for action. Welcome aboard.</p>
              </div>
              
              <button 
                onClick={handleFinish}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Launch Dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
    </div>
  )
}
