"use server"

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    const fullName = formData.get('full_name') as string
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Update Profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (profileError) throw new Error(profileError.message)

    // 2. Update Auth Metadata to move to next step
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        onboarding_step: 2 
      }
    })

    if (authError) throw new Error(authError.message)

    revalidatePath('/onboarding')
    return { success: true }
  } catch (error: any) {
    console.error('Onboarding Error (Profile):', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}

export async function submitPreferences(formData: FormData) {
  try {
    const supabase = await createClient()
    const theme = formData.get('theme') as string
    const notifications = formData.get('notifications') === 'on'
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Update Preferences in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        preferences: { theme, notifications } 
      })
      .eq('id', user.id)

    if (profileError) throw new Error(profileError.message)

    // 2. Update Auth Metadata to complete onboarding
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        onboarding_step: 3,
        onboarding_completed: true 
      }
    })

    if (authError) throw new Error(authError.message)

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    console.error('Onboarding Error (Preferences):', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}
