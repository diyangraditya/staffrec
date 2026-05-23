import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { createCandidate } from '../../services/candidateService'
import { useToast } from '../ui/Toast'

interface AddCandidateModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddCandidateModal({ onClose, onSuccess }: AddCandidateModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    background: '',
    internal_score: 7.0,
    internal_notes: '',
  })

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createCandidate(form)
      showToast(`${form.name} added successfully!`)
      onSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to add candidate.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add New Candidate</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Aditya Rajan"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="aditya@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Background</label>
            <textarea
              value={form.background}
              onChange={(e) => set('background', e.target.value)}
              rows={3}
              required
              placeholder="3 years consulting experience, strong in data analysis..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Internal Score: <span className="text-indigo-600 font-bold">{form.internal_score.toFixed(1)}</span>/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={form.internal_score}
              onChange={(e) => set('internal_score', parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Recruiter Notes</label>
            <textarea
              value={form.internal_notes}
              onChange={(e) => set('internal_notes', e.target.value)}
              rows={2}
              placeholder="Good communicator, needs to work on..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Add Candidate
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
