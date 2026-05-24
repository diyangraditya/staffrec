import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/cards/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import MarkdownContent from '../../components/ui/MarkdownContent'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import PreviewBriefModal from '../../components/modals/PreviewBriefModal'
import { getCandidate, updateCandidate, deleteCandidate } from '../../services/candidateService'
import { getClients } from '../../services/clientService'
import { generateBrief, getBrief, deleteBrief, sendBrief } from '../../services/briefService'
import { createAssignment, updateAssignmentStatus, updateAssignmentDate, deleteAssignment } from '../../services/assignmentService'
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
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [interviewDate, setInterviewDate] = useState('')
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editDateValue, setEditDateValue] = useState('')
  const [deletingAssignment, setDeletingAssignment] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sendingBrief, setSendingBrief] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    background: '',
    internal_score: 0,
    internal_notes: '',
  })

  const fetchData = async () => {
    if (!id) return
    try {
      const [cand, allClients] = await Promise.all([
        getCandidate(Number(id)),
        getClients(),
      ])
      setCandidate(cand)
      setClients(allClients)
      setEditForm({
        name: cand.name,
        email: cand.email,
        background: cand.background,
        internal_score: cand.internal_score,
        internal_notes: cand.internal_notes,
      })

      if (cand.assignment) {
        const client = allClients.find((c) => c.id === cand.assignment!.client_id)
        setAssignedClient(client ?? null)
        try {
          const b = await getBrief(cand.assignment.id)
          setBrief(b)
        } catch {
          // No brief yet
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
        interview_date: interviewDate || null,
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

  const handleStatusChange = async (newStatus: string) => {
    if (!candidate?.assignment) return
    setUpdatingStatus(true)
    try {
      await updateAssignmentStatus(candidate.assignment.id, newStatus)
      showToast('Assignment status updated!')
      await fetchData()
    } catch {
      showToast('Failed to update status.', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleUpdateDate = async () => {
    if (!candidate?.assignment) return
    try {
      await updateAssignmentDate(candidate.assignment.id, editDateValue || null)
      showToast('Interview date updated!')
      setIsEditingDate(false)
      await fetchData()
    } catch {
      showToast('Failed to update date.', 'error')
    }
  }

  const handleDeleteAssignment = async () => {
    if (!candidate?.assignment) return
    setDeletingAssignment(true)
    try {
      await deleteAssignment(candidate.assignment.id)
      showToast('Assignment removed.')
      setBrief(null)
      setAssignedClient(null)
      await fetchData()
    } catch {
      showToast('Failed to remove assignment.', 'error')
    } finally {
      setDeletingAssignment(false)
    }
  }

  const handleGenerateBrief = async () => {
    if (!candidate?.assignment) return
    setGeneratingBrief(true)
    try {
      const b = await generateBrief(candidate.assignment.id)
      setBrief(b)
      showToast('AI brief generated successfully! ✨')
      const updated = await getCandidate(Number(id))
      setCandidate(updated)
    } catch {
      showToast('Failed to generate brief. Check AWS credentials.', 'error')
    } finally {
      setGeneratingBrief(false)
    }
  }

  const handleRegenerateBrief = async () => {
    if (!candidate?.assignment || !brief) return
    setGeneratingBrief(true)
    try {
      await deleteBrief(candidate.assignment.id)
      setBrief(null)
      const b = await generateBrief(candidate.assignment.id)
      setBrief(b)
      showToast('Brief regenerated successfully! ✨')
      const updated = await getCandidate(Number(id))
      setCandidate(updated)
    } catch {
      showToast('Failed to regenerate brief.', 'error')
    } finally {
      setGeneratingBrief(false)
    }
  }

  const handleSendBrief = async () => {
    if (!candidate?.assignment) return
    setSendingBrief(true)
    try {
      await sendBrief(candidate.assignment.id)
      showToast('Email sent to candidate successfully!')
    } catch {
      showToast('Failed to send email. Check backend logs.', 'error')
    } finally {
      setSendingBrief(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!candidate) return
    setSaving(true)
    try {
      await updateCandidate(candidate.id, editForm)
      showToast('Candidate updated!')
      setIsEditing(false)
      await fetchData()
    } catch {
      showToast('Failed to update candidate.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!candidate) return
    setDeleting(true)
    try {
      await deleteCandidate(candidate.id)
      showToast(`${candidate.name} deleted.`)
      navigate('/recruiter/dashboard')
    } catch {
      showToast('Failed to delete candidate.', 'error')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading)
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-60 flex-1 flex items-center justify-center pt-16 md:pt-0">
          <LoadingSpinner message="Loading candidate profile..." />
        </main>
      </div>
    )

  if (!candidate) return null

  const assignment = candidate.assignment

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title={`Delete ${candidate.name}?`}
          message="This will permanently delete the candidate, their assignment, brief, and all feedback. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}

      {showPreview && assignedClient && brief && (
        <PreviewBriefModal
          onClose={() => setShowPreview(false)}
          candidate={candidate}
          client={assignedClient}
          brief={brief}
        />
      )}

      <main className="ml-0 md:ml-60 flex-1 p-4 pt-20 md:pt-8 md:p-8">
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
            {!isEditing ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{candidate.name}</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{candidate.email}</p>
                    <p className="text-slate-600 text-sm mt-2 max-w-lg">{candidate.background}</p>
                  </div>
                  <div className="flex flex-col items-center bg-indigo-50 rounded-xl px-4 py-3 shrink-0">
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
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" className="text-xs" onClick={() => setIsEditing(true)}>
                    ✏️ Edit
                  </Button>
                  <Button variant="danger" className="text-xs" onClick={() => setShowDeleteConfirm(true)}>
                    🗑 Delete
                  </Button>
                </div>
              </>
            ) : (
              // Edit form
              <div className="space-y-4">
                <h2 className="font-semibold text-slate-800">Edit Candidate</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Background</label>
                  <textarea
                    value={editForm.background}
                    onChange={(e) => setEditForm((f) => ({ ...f, background: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Score: <span className="text-indigo-600 font-bold">{editForm.internal_score.toFixed(1)}</span>/10
                  </label>
                  <input
                    type="range"
                    min="1" max="10" step="0.1"
                    value={editForm.internal_score}
                    onChange={(e) => setEditForm((f) => ({ ...f, internal_score: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Recruiter Notes</label>
                  <textarea
                    value={editForm.internal_notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, internal_notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="primary" onClick={handleSaveEdit} loading={saving}>Save Changes</Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {/* Assignment section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Assignment</h2>

            {assignment ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Assigned to</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {assignedClient?.company ?? `Client #${assignment.client_id}`}
                    </p>

                    {/* Interview Date */}
                    {isEditingDate ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={handleUpdateDate} className="text-xs text-indigo-600 font-medium hover:underline">Save</button>
                        <button onClick={() => setIsEditingDate(false)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400">
                          {assignment.interview_date
                            ? `Interview: ${new Date(assignment.interview_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : 'No interview date set'}
                        </p>
                        <button
                          onClick={() => {
                            setEditDateValue(assignment.interview_date ? assignment.interview_date.slice(0, 10) : '')
                            setIsEditingDate(true)
                          }}
                          className="text-xs text-indigo-500 hover:underline"
                        >
                          ✏️ Edit date
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={assignment.status} />
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updatingStatus}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="briefed">Briefed</option>
                        <option value="interviewed">Interviewed</option>
                      </select>
                    </div>

                    {(assignment.status === 'briefed' || assignment.status === 'interviewed') && (
                      <Button
                        variant="secondary"
                        className="text-xs"
                        onClick={() => navigate(`/recruiter/feedback/${assignment.id}`)}
                      >
                        {assignment.status === 'briefed' ? 'Submit Feedback' : 'View / Edit Feedback'}
                      </Button>
                    )}
                    <button
                      onClick={handleDeleteAssignment}
                      disabled={deletingAssignment}
                      className="text-xs text-rose-500 hover:text-rose-700 hover:underline mt-1 transition-colors"
                    >
                      {deletingAssignment ? 'Removing…' : '🗑 Remove assignment'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Assign to client</label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.company}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Interview Date (optional)"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
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
              <LoadingSpinner size="md" message="AI is generating your brief… this takes 3–8 seconds" />
            )}

            {brief && !generatingBrief && (
              <div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                  <MarkdownContent
                    content={brief.content.slice(0, 600) + (brief.content.length > 600 ? '…' : '')}
                  />
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Generated {new Date(brief.generated_at).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => navigate(`/recruiter/feedback/${assignment!.id}`)}
                  >
                    Submit Post-Interview Feedback →
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setShowPreview(true)}
                  >
                    👁 Preview Candidate View
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={handleSendBrief}
                    loading={sendingBrief}
                  >
                    📧 Send Brief to Candidate
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={handleRegenerateBrief}
                  >
                    🔄 Regenerate Brief
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
