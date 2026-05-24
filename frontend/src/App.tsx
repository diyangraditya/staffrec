import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Dashboard from './pages/recruiter/Dashboard'
import ClientProfile from './pages/recruiter/ClientProfile'
import CandidateProfile from './pages/recruiter/CandidateProfile'
import FeedbackForm from './pages/recruiter/FeedbackForm'
import Analytics from './pages/recruiter/Analytics'
import BriefView from './pages/candidate/BriefView'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />

            {/* Recruiter routes */}
            <Route
              path="/recruiter/dashboard"
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/clients/:id"
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <ClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/candidates/:id"
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <CandidateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/feedback/:assignmentId"
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <FeedbackForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/analytics"
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Candidate routes */}
            <Route
              path="/candidate/brief"
              element={
                <ProtectedRoute requiredRole="candidate">
                  <BriefView />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
