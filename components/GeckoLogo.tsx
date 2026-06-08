export function GeckoLogo({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 4c-1.5 0-2.5 1.5-2.5 3s.5 2.5 1 3.5l1.5 3s-1.5 1-2 2.5-.5 3.5.5 4h3c1 0 1-2.5.5-4s-2-2.5-2-2.5l1.5-3c.5-1 1-2 1-3.5S13.5 4 12 4z" />
      <path d="M9.5 7L7 6M14.5 7l2.5-1M10.5 16l-3 1M13.5 16l3 1" />
      <circle cx="11" cy="6" r="0.5" fill="currentColor" />
      <circle cx="13" cy="6" r="0.5" fill="currentColor" />
    </svg>
  )
}
