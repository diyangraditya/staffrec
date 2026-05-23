interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <svg
        className={`animate-spin ${sizeMap[size]} text-indigo-600`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      {message && (
        <p className="text-sm text-slate-500 text-center max-w-xs">{message}</p>
      )}
    </div>
  )
}
