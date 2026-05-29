"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else alert('Check your email for the confirmation link!')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 absolute inset-0 z-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8 tracking-widest">
          <span className="text-emerald-400">GEKKO</span> LOGIN
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleSignIn}
              className="flex-1 bg-gray-900 text-white p-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Sign In
            </button>
            <button 
              onClick={handleSignUp}
              className="flex-1 bg-emerald-100 text-emerald-800 p-2 rounded-md hover:bg-emerald-200 transition-colors font-medium"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}