import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCandidate } from '../../services/candidateService'
import { getClients } from '../../services/clientService'
import { getBrief } from '../../services/briefService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MarkdownContent from '../../components/ui/MarkdownContent'
import type { CandidateDetail, Client, Brief } from '../../types'

export default function BriefView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const [cand, allClients] = await Promise.all([
          getCandidate(user.id),
          getClients(),
        ])
        setCandidate(cand)

        if (cand.assignment) {
          const cl = allClients.find((c) => c.id === cand.assignment!.client_id)
          setClient(cl ?? null)
          try {
            const b = await getBrief(cand.assignment.id)
            setBrief(b)
          } catch {
            // Brief not generated yet
          }
        }
      } catch {
        setError('Failed to load your brief. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple top nav for candidates */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Staffrec</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading && <LoadingSpinner message="Loading your interview brief..." />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Welcome */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome, {user?.name} 👋
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Your personalized interview preparation brief
              </p>
            </div>

            {/* Interview details card */}
            {candidate?.assignment && client && (
              <div className="bg-indigo-600 text-white rounded-xl p-5 mb-6 shadow-md">
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">
                  Upcoming Interview
                </p>
                <h2 className="text-xl font-bold">{client.company}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full capitalize">
                    {client.interview_style} style
                  </span>
                  {candidate.assignment.interview_date && (
                    <span className="text-indigo-200 text-sm">
                      {new Date(candidate.assignment.interview_date).toLocaleDateString(
                        'en-US',
                        { weekday: 'long', day: 'numeric', month: 'long' }
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* No assignment yet */}
            {!candidate?.assignment && (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center shadow-sm">
                <p className="text-3xl mb-3">📋</p>
                <p className="font-semibold text-slate-700">No interview assigned yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Your recruiter will assign you to a client interview soon.
                </p>
              </div>
            )}

            {/* Brief */}
            {candidate?.assignment && !brief && (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center shadow-sm">
                <p className="text-3xl mb-3">⏳</p>
                <p className="font-semibold text-slate-700">Brief not generated yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Your recruiter is preparing your personalized prep brief.
                </p>
              </div>
            )}

            {brief && (
              <>
                <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-800">
                      Your Prep Brief
                    </h2>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print / Save
                    </button>
                  </div>

                  <MarkdownContent content={brief.content} />
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 pb-8">
                  Generated by Staffrec AI · Powered by AWS Bedrock
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
