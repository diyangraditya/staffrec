import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCandidates } from '../services/candidateService'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import api from '../services/api'

type Role = 'recruiter' | 'candidate'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('recruiter')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-switch default email when role changes
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setError('')
    setEmail('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (role === 'recruiter') {
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

        const res = await api.post('/auth/login', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        const token = res.data.access_token

        // Now we need to set the token for subsequent requests
        localStorage.setItem('token', token)
        
        // Fetch user data
        const userRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        login(token, userRes.data)
        navigate('/recruiter/dashboard')
      } else {
        // Candidate: look up by email
        const candidates = await getCandidates()
        const found = candidates.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        )
        if (!found) {
          setError(
            'No candidate found with that email. Try sari.dewi@example.com or aditya.rajan@example.com'
          )
          return
        }
        login('mock_candidate_token', { role: 'candidate', name: found.name, id: found.id, email: found.email })
        navigate('/candidate/brief')
      }
    } catch {
      setError('Something went wrong. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Wordmark */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-3">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staffrec</h1>
            <p className="text-slate-500 text-sm mt-1">AI-powered interview prep platform</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['recruiter', 'candidate'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium cursor-pointer ${
                  role === r
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">{r === 'recruiter' ? '🧑‍💼' : '👤'}</span>
                <span>I'm a {r === 'recruiter' ? 'Recruiter' : 'Candidate'}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder={
                role === 'candidate'
                  ? 'sari.dewi@example.com'
                  : 'recruiter@staffrec.io'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {role === 'recruiter' && (
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-2.5 text-base"
            >
              Sign In
            </Button>
          </form>

          {role === 'candidate' && (
            <p className="text-xs text-center text-slate-400 mt-4">
              Demo: use <code className="bg-slate-100 px-1 rounded">sari.dewi@example.com</code> (briefed) or{' '}
              <code className="bg-slate-100 px-1 rounded">aditya.rajan@example.com</code> (pending)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
