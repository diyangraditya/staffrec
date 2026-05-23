import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import CandidateCard from '../../components/cards/CandidateCard'
import ClientCard from '../../components/cards/ClientCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { getCandidates } from '../../services/candidateService'
import { getClients } from '../../services/clientService'
import type { CandidateDetail, Client } from '../../types'

export default function Dashboard() {
  const [candidates, setCandidates] = useState<CandidateDetail[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCandidates(), getClients()])
      .then(([c, cl]) => {
        setCandidates(c)
        setClients(cl)
      })
      .catch(() => setError('Failed to load data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  // Stats
  const total = candidates.length
  const pending = candidates.filter((c) => c.assignment?.status === 'pending').length
  const briefed = candidates.filter((c) => c.assignment?.status === 'briefed').length
  const interviewed = candidates.filter(
    (c) => c.assignment?.status === 'interviewed'
  ).length

  const stats = [
    { label: 'Total Candidates', value: total, color: 'text-slate-700' },
    { label: 'Pending Brief', value: pending, color: 'text-amber-600' },
    { label: 'Briefed', value: briefed, color: 'text-indigo-600' },
    { label: 'Interviewed', value: interviewed, color: 'text-emerald-600' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your candidate pipeline</p>
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
              <div className="grid grid-cols-4 gap-4 mb-8">
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
              <div className="grid grid-cols-3 gap-6">
                {/* Candidate Pipeline */}
                <div className="col-span-2">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">
                    Candidate List
                  </h2>
                  <div className="space-y-3">
                    {candidates.length === 0 ? (
                      <p className="text-sm text-slate-400">No candidates yet.</p>
                    ) : (
                      candidates.map((c) => (
                        <CandidateCard key={c.id} candidate={c} clientMap={clientMap} />
                      ))
                    )}
                  </div>
                </div>

                {/* Clients */}
                <div>
                  <h2 className="text-base font-semibold text-slate-700 mb-3">
                    Client Companies
                  </h2>
                  <div className="space-y-3">
                    {clients.map((c) => (
                      <ClientCard key={c.id} client={c} />
                    ))}
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
