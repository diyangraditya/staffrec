import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/cards/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import { getClient, updateClient, deleteClient } from '../../services/clientService'
import { useToast } from '../../components/ui/Toast'
import type { ClientDetail } from '../../types'

const styleConfig: Record<string, { label: string; className: string }> = {
  consulting: { label: 'Consulting', className: 'bg-purple-100 text-purple-700' },
  startup: { label: 'Startup', className: 'bg-orange-100 text-orange-700' },
}

const INTERVIEW_STYLES = ['consulting', 'startup', 'corporate', 'technical', 'behavioral']

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    interview_style: '',
    expectations: [] as string[],
  })
  const [expectationInput, setExpectationInput] = useState('')

  const fetchData = async () => {
    if (!id) return
    try {
      const cl = await getClient(Number(id))
      setClient(cl)
      setEditForm({
        name: cl.name,
        company: cl.company,
        interview_style: cl.interview_style,
        expectations: cl.expectations,
      })
    } catch {
      setError('Failed to load client.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleSaveEdit = async () => {
    if (!client) return
    setSaving(true)
    try {
      await updateClient(client.id, editForm)
      showToast('Client updated!')
      setIsEditing(false)
      await fetchData()
    } catch {
      showToast('Failed to update client.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!client) return
    setDeleting(true)
    try {
      await deleteClient(client.id)
      showToast(`${client.company} deleted.`)
      navigate('/recruiter/dashboard')
    } catch {
      showToast('Failed to delete client.', 'error')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const addExpectation = () => {
    const trimmed = expectationInput.trim()
    if (trimmed && !editForm.expectations.includes(trimmed)) {
      setEditForm((prev) => ({ ...prev, expectations: [...prev.expectations, trimmed] }))
    }
    setExpectationInput('')
  }

  const removeExpectation = (exp: string) =>
    setEditForm((prev) => ({ ...prev, expectations: prev.expectations.filter((e) => e !== exp) }))

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

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title={`Delete ${client.company}?`}
          message="This will permanently delete the client, their assignments, briefs, and all feedback history. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
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
                    <h1 className="text-xl font-bold text-slate-900">{client.company}</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Contact: {client.name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
                <div className="mt-6 flex gap-2">
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
                <h2 className="font-semibold text-slate-800">Edit Client</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    label="Company Name"
                    value={editForm.company}
                    onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Interview Style</label>
                  <select
                    value={editForm.interview_style}
                    onChange={(e) => setEditForm((f) => ({ ...f, interview_style: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                  >
                    {INTERVIEW_STYLES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">What They Look For</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={expectationInput}
                      onChange={(e) => setExpectationInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExpectation() } }}
                      placeholder='Type an expectation and press Enter or "Add"'
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button type="button" variant="secondary" onClick={addExpectation}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editForm.expectations.map((exp) => (
                      <span
                        key={exp}
                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm px-3 py-1 rounded-full"
                      >
                        {exp}
                        <button
                          type="button"
                          onClick={() => removeExpectation(exp)}
                          className="text-indigo-400 hover:text-indigo-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="primary" onClick={handleSaveEdit} loading={saving}>Save Changes</Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {/* What they look for (Read-only view) */}
          {!isEditing && (
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
          )}

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
