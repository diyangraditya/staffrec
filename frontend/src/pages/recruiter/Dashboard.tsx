import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../../components/Sidebar'
import CandidateCard from '../../components/cards/CandidateCard'
import ClientCard from '../../components/cards/ClientCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import AddCandidateModal from '../../components/modals/AddCandidateModal'
import AddClientModal from '../../components/modals/AddClientModal'
import { getCandidates } from '../../services/candidateService'
import { getClients } from '../../services/clientService'
import type { CandidateDetail, Client } from '../../types'

export default function Dashboard() {
  const [candidates, setCandidates] = useState<CandidateDetail[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([getCandidates(), getClients()])
      .then(([c, cl]) => {
        setCandidates(c)
        setClients(cl)
      })
      .catch(() => setError('Failed to load data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  // Filter candidates based on search query AND active tab
  const filteredCandidates = candidates.filter((c) => {
    // 1. Tab filter
    const isCompleted = !!c.assignment?.feedback
    if (activeTab === 'active' && isCompleted) return false
    if (activeTab === 'completed' && !isCompleted) return false

    // 2. Search query filter
    const query = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.background.toLowerCase().includes(query)
    )
  })

  // Stats
  const pending = candidates.filter((c) => c.assignment?.status === 'pending' && !c.assignment.feedback).length
  const briefed = candidates.filter((c) => c.assignment?.status === 'briefed' && !c.assignment.feedback).length
  const interviewed = candidates.filter((c) => c.assignment?.status === 'interviewed' && !c.assignment.feedback).length
  const completed = candidates.filter((c) => !!c.assignment?.feedback).length

  const stats = [
    { label: 'Pending Brief', value: pending, color: 'text-amber-600' },
    { label: 'Briefed', value: briefed, color: 'text-indigo-600' },
    { label: 'Active Interview', value: interviewed, color: 'text-blue-600' },
    { label: 'Completed', value: completed, color: 'text-emerald-600' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Modals */}
      {showAddCandidate && (
        <AddCandidateModal
          onClose={() => setShowAddCandidate(false)}
          onSuccess={() => { setShowAddCandidate(false); loadData() }}
        />
      )}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => { setShowAddClient(false); loadData() }}
        />
      )}

      {/* Main */}
      <main className="ml-0 md:ml-60 flex-1 p-4 pt-20 md:pt-8 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 mt-1">Manage your candidate pipeline</p>
            </div>
          </div>

          {loading && <LoadingSpinner message="Loading dashboard..." />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-5"
                  >
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Candidate List */}
                <div className="col-span-1 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveTab('active')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'active'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Active Pipeline
                      </button>
                      <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'completed'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Completed Outcomes
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search candidates..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <Button
                        variant="primary"
                        className="text-xs px-3 py-1.5"
                        onClick={() => setShowAddCandidate(true)}
                      >
                        + Add Candidate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {filteredCandidates.length === 0 ? (
                      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center">
                        <p className="text-slate-400 text-sm">
                          {candidates.length === 0 ? 'No candidates yet.' : 'No candidates match your search.'}
                        </p>
                        {candidates.length === 0 && (
                          <Button
                            variant="secondary"
                            className="mt-3 text-xs"
                            onClick={() => setShowAddCandidate(true)}
                          >
                            Add your first candidate
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredCandidates.map((c) => (
                        <CandidateCard key={c.id} candidate={c} clientMap={clientMap} />
                      ))
                    )}
                  </div>
                </div>

                {/* Clients */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-slate-700">Client Companies</h2>
                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-1.5"
                      onClick={() => setShowAddClient(true)}
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {clients.length === 0 ? (
                      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center">
                        <p className="text-slate-400 text-sm mb-2">No clients yet.</p>
                        <Button
                          variant="secondary"
                          className="text-xs"
                          onClick={() => setShowAddClient(true)}
                        >
                          Add first client
                        </Button>
                      </div>
                    ) : (
                      clients.map((c) => (
                        <ClientCard key={c.id} client={c} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
