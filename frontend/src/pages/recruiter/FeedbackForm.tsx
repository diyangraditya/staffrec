import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import { getAssignment } from '../../services/assignmentService'
import { submitFeedback, getFeedback } from '../../services/feedbackService'
import { useToast } from '../../components/ui/Toast'
import type { AssignmentDetail, Feedback } from '../../types'

export default function FeedbackForm() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [result, setResult] = useState<'pass' | 'fail' | ''>('')
  const [clientRemarks, setClientRemarks] = useState('')
  const [feedbackNotes, setFeedbackNotes] = useState('')

  useEffect(() => {
    if (!assignmentId) return
    const aId = Number(assignmentId)
    Promise.all([
      getAssignment(aId),
      getFeedback(aId).catch(() => null),
    ])
      .then(([a, fb]) => {
        setAssignment(a)
        if (fb) {
          setExistingFeedback(fb)
          setResult(fb.result)
          setClientRemarks(fb.client_remarks)
          setFeedbackNotes(fb.feedback_notes)
        }
      })
      .finally(() => setLoading(false))
  }, [assignmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result || !assignmentId) return
    setSubmitting(true)
    try {
      await submitFeedback({
        assignment_id: Number(assignmentId),
        result,
        feedback_notes: feedbackNotes,
        client_remarks: clientRemarks,
      })
      showToast('Feedback submitted successfully!')
      navigate('/recruiter/dashboard')
    } catch {
      showToast('Failed to submit feedback. It may have already been submitted.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-60 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Loading assignment..." />
        </main>
      </div>
    )

  if (!assignment) return null

  const isReadOnly = !!existingFeedback

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate(`/recruiter/candidates/${assignment.candidate_id}`)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Candidate
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
            <h1 className="text-xl font-bold text-slate-900">
              {isReadOnly ? 'Interview Feedback' : 'Submit Feedback'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {assignment.candidate.name} → {assignment.client.company}
            </p>
            {isReadOnly && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mt-3 inline-block">
                Feedback already submitted — read only
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Result selector */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Interview Result
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['pass', 'fail'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && setResult(r)}
                    className={`p-5 rounded-xl border-2 font-semibold text-lg transition-all ${
                      isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                    } ${
                      result === r
                        ? r === 'pass'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-red-400 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {r === 'pass' ? '✓ Pass' : '✕ Fail'}
                  </button>
                ))}
              </div>
            </div>

            {/* Client remarks */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Client Remarks
              </label>
              <textarea
                value={clientRemarks}
                onChange={(e) => setClientRemarks(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                placeholder="What did the client say after the interview?"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Recruiter notes */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Recruiter Notes
              </label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                placeholder="Your observations from the debrief..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {!isReadOnly && (
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={!result}
                className="w-full py-3 text-base"
              >
                Submit Feedback
              </Button>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}
