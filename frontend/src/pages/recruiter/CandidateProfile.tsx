import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/cards/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import MarkdownContent from '../../components/ui/MarkdownContent'
import { getCandidate } from '../../services/candidateService'
import { getClients } from '../../services/clientService'
import { generateBrief, getBrief } from '../../services/briefService'
import { createAssignment } from '../../services/assignmentService'
import { useToast } from '../../components/ui/Toast'
import type { CandidateDetail, Client, Brief } from '../../types'

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [brief, setBrief] = useState<Brief | null>(null)
  const [assignedClient, setAssignedClient] = useState<Client | null>(null)

  const [loading, setLoading] = useState(true)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [error, setError] = useState('')

  const fetchData = async () => {
    if (!id) return
    try {
      const [cand, allClients] = await Promise.all([
        getCandidate(Number(id)),
        getClients(),
      ])
      setCandidate(cand)
      setClients(allClients)

      if (cand.assignment) {
        const client = allClients.find((c) => c.id === cand.assignment!.client_id)
        setAssignedClient(client ?? null)

        // Try to fetch existing brief
        try {
          const b = await getBrief(cand.assignment.id)
          setBrief(b)
        } catch {
          // No brief yet — that's fine
        }
      }
    } catch {
      setError('Failed to load candidate.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleAssign = async () => {
    if (!candidate || !selectedClientId) return
    setAssigning(true)
    try {
      await createAssignment({
        candidate_id: candidate.id,
        client_id: Number(selectedClientId),
      })
      showToast('Candidate assigned successfully!')
      setLoading(true)
      await fetchData()
    } catch {
      showToast('Failed to assign candidate.', 'error')
    } finally {
      setAssigning(false)
    }
  }

  const handleGenerateBrief = async () => {
    if (!candidate?.assignment) return
    setGeneratingBrief(true)
    try {
      const b = await generateBrief(candidate.assignment.id)
      setBrief(b)
      showToast('AI brief generated successfully! ✨')
      // Refresh candidate to update status
      const updated = await getCandidate(Number(id))
      setCandidate(updated)
    } catch {
      showToast('Failed to generate brief. Check AWS credentials.', 'error')
    } finally {
      setGeneratingBrief(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-60 flex-1 flex items-center justify-center">
        <LoadingSpinner message="Loading candidate profile..." />
      </main>
    </div>
  )

  if (!candidate) return null

  const assignment = candidate.assignment

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
                <h1 className="text-xl font-bold text-slate-900">{candidate.name}</h1>
                <p className="text-slate-500 text-sm mt-0.5">{candidate.email}</p>
                <p className="text-slate-600 text-sm mt-2 max-w-lg">{candidate.background}</p>
              </div>
              <div className="flex flex-col items-center bg-indigo-50 rounded-xl px-4 py-3">
                <span className="text-2xl font-bold text-indigo-700">
                  {candidate.internal_score.toFixed(1)}
                </span>
                <span className="text-xs text-indigo-500">/10</span>
              </div>
            </div>

            {candidate.internal_notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Recruiter Notes
                </p>
                <p className="text-sm text-slate-600">{candidate.internal_notes}</p>
              </div>
            )}
          </div>

          {/* Assignment section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Assignment</h2>

            {assignment ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Assigned to</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {assignedClient?.company ?? `Client #${assignment.client_id}`}
                  </p>
                  {assignment.interview_date && (
                    <p className="text-xs text-slate-400 mt-1">
                      Interview:{' '}
                      {new Date(assignment.interview_date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={assignment.status} />
                  {assignment.status === 'briefed' && (
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/recruiter/feedback/${assignment.id}`)}
                    >
                      Submit Feedback
                    </Button>
                  )}
                  {assignment.status === 'interviewed' && (
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/recruiter/feedback/${assignment.id}`)}
                    >
                      View Feedback
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Assign to client
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAssign}
                  loading={assigning}
                  disabled={!selectedClientId}
                >
                  Assign
                </Button>
              </div>
            )}
          </div>

          {/* Brief section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">AI Interview Brief</h2>

            {!assignment && (
              <p className="text-sm text-slate-400 italic">Assign candidate to a client first.</p>
            )}

            {assignment && !brief && !generatingBrief && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-slate-500">No brief generated yet.</p>
                <Button variant="primary" onClick={handleGenerateBrief}>
                  ✨ Generate AI Brief
                </Button>
              </div>
            )}

            {generatingBrief && (
              <LoadingSpinner
                size="md"
                message="AI is generating your brief… this takes 3–8 seconds"
              />
            )}

            {brief && !generatingBrief && (
              <div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                  <MarkdownContent content={brief.content.slice(0, 600) + (brief.content.length > 600 ? '…' : '')} />
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Generated {new Date(brief.generated_at).toLocaleString()}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/recruiter/feedback/${assignment!.id}`)}
                >
                  Submit Post-Interview Feedback →
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
