import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { type ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'recruiter' | 'candidate'
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    // Role mismatch — redirect to the correct dashboard
    if (user.role === 'recruiter') {
      return <Navigate to="/recruiter/dashboard" replace />
    }
    return <Navigate to="/candidate/brief" replace />
  }

  return <>{children}</>
}
