"use client"

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'bg-card text-foreground border border-border text-sm font-medium',
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
    </ThemeProvider>
  )
}
