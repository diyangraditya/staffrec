import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { createClient } from '../../services/clientService'
import { useToast } from '../ui/Toast'

interface AddClientModalProps {
  onClose: () => void
  onSuccess: () => void
}

const INTERVIEW_STYLES = ['consulting', 'startup', 'corporate', 'technical', 'behavioral']

export default function AddClientModal({ onClose, onSuccess }: AddClientModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    interview_style: 'consulting',
    expectations: [] as string[],
  })
  const [expectationInput, setExpectationInput] = useState('')

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addExpectation = () => {
    const trimmed = expectationInput.trim()
    if (trimmed && !form.expectations.includes(trimmed)) {
      setForm((prev) => ({ ...prev, expectations: [...prev.expectations, trimmed] }))
    }
    setExpectationInput('')
  }

  const removeExpectation = (exp: string) =>
    setForm((prev) => ({ ...prev, expectations: prev.expectations.filter((e) => e !== exp) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.expectations.length === 0) {
      showToast('Add at least one expectation.', 'error')
      return
    }
    setLoading(true)
    try {
      await createClient(form)
      showToast(`${form.company} added successfully!`)
      onSuccess()
    } catch {
      showToast('Failed to add client.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Name"
              placeholder="Jonathan Mak"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
            <Input
              label="Company Name"
              placeholder="Vertex Consulting"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Interview Style</label>
            <select
              value={form.interview_style}
              onChange={(e) => set('interview_style', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              {INTERVIEW_STYLES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              What They Look For
            </label>
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
              {form.expectations.map((exp) => (
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
              {form.expectations.length === 0 && (
                <p className="text-xs text-slate-400">No expectations added yet.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loading}>Add Client</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
