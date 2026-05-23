import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/cards/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { getClient } from '../../services/clientService'
import type { ClientDetail } from '../../types'

const styleConfig: Record<string, { label: string; className: string }> = {
  consulting: { label: 'Consulting', className: 'bg-purple-100 text-purple-700' },
  startup: { label: 'Startup', className: 'bg-orange-100 text-orange-700' },
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getClient(Number(id))
      .then(setClient)
      .catch(() => setError('Failed to load client.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading)
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-60 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Loading client profile..." />
        </main>
      </div>
    )

  if (!client) return null

  const style = styleConfig[client.interview_style] ?? {
    label: client.interview_style,
    className: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Header card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{client.company}</h1>
                <p className="text-slate-500 text-sm mt-0.5">Contact: {client.name}</p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.className}`}
              >
                {style.label}
              </span>
            </div>
          </div>

          {/* What they look for */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-base font-semibold text-slate-800 mb-3">What They Look For</h2>
            <div className="flex flex-wrap gap-2">
              {client.expectations.map((exp) => (
                <span
                  key={exp}
                  className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm px-3 py-1 rounded-full font-medium"
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>

          {/* Past Feedback */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Past Interview Feedback
            </h2>

            {client.feedback_history.length === 0 ? (
              <p className="text-sm text-slate-400">No past feedback recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {[...client.feedback_history]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .map((fb) => (
                    <div
                      key={fb.id}
                      className="border border-slate-100 rounded-lg p-4 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">
                          Assignment #{fb.assignment_id}
                        </span>
                        <StatusBadge status={fb.result} />
                      </div>
                      {fb.client_remarks && (
                        <p className="text-sm text-slate-700 mb-1">
                          <span className="font-medium text-slate-500">Client: </span>
                          "{fb.client_remarks}"
                        </p>
                      )}
                      {fb.feedback_notes && (
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Notes: </span>
                          {fb.feedback_notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
