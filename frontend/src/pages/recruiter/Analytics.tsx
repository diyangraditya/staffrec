import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../../components/Sidebar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import api from '../../services/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface AnalyticsOverview {
  total_candidates: number
  pipeline: Record<string, number>
  outcomes: {
    pass: number
    fail: number
  }
  average_scores: {
    passed_candidates: number
    failed_candidates: number
  }
  client_performance: Array<{
    client_id: number
    client_name: string
    total_interviews: number
    passes: number
    pass_rate: number
  }>
}

const COLORS = ['#10b981', '#f43f5e', '#6366f1', '#f59e0b', '#3b82f6']

export default function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/overview')
      setData(res.data)
    } catch {
      setError('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return <LoadingSpinner message="Loading analytics..." />
  if (error || !data) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="ml-0 md:ml-60 flex-1 p-4 pt-20 md:pt-8 md:p-8 text-red-500">{error}</main>
      </div>
    )
  }

  // Transform pipeline data for PieChart
  const pipelineData = Object.entries(data.pipeline).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  // Transform outcomes for BarChart
  const outcomeData = [
    { name: 'Pass', value: data.outcomes.pass, fill: '#10b981' },
    { name: 'Fail', value: data.outcomes.fail, fill: '#f43f5e' }
  ]

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-0 md:ml-60 flex-1 p-4 pt-20 md:pt-8 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Analytics Overview</h1>
            <p className="text-slate-500 mt-1">High-level metrics across all candidates and clients</p>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <p className="text-sm text-slate-500 mb-1">Total Candidates</p>
              <p className="text-3xl font-bold text-slate-800">{data.total_candidates}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <p className="text-sm text-slate-500 mb-1">Avg Score (Passed)</p>
              <p className="text-3xl font-bold text-emerald-600">{data.average_scores.passed_candidates}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <p className="text-sm text-slate-500 mb-1">Avg Score (Failed)</p>
              <p className="text-3xl font-bold text-rose-600">{data.average_scores.failed_candidates}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Pipeline Status Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-96">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Pipeline Status</h2>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: { name?: string, percent?: number }) => `${name || 'Unknown'} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pipelineData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Outcomes Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-96">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Overall Outcomes</h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Client Pass Rates</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium text-right">Total Interviews</th>
                  <th className="px-6 py-3 font-medium text-right">Passes</th>
                  <th className="px-6 py-3 font-medium text-right">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.client_performance.map((client) => (
                  <tr key={client.client_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">{client.client_name}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{client.total_interviews}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-medium">{client.passes}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        client.pass_rate >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {client.pass_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {data.client_performance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No interview outcomes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
