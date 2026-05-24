import { useNavigate } from 'react-router-dom'
import type { CandidateDetail, Client } from '../../types'
import StatusBadge from './StatusBadge'

interface CandidateCardProps {
  candidate: CandidateDetail
  clientMap: Map<number, Client>
}

export default function CandidateCard({ candidate, clientMap }: CandidateCardProps) {
  const navigate = useNavigate()
  const assignment = candidate.assignment
  const client = assignment ? clientMap.get(assignment.client_id) : null

  return (
    <div
      onClick={() => navigate(`/recruiter/candidates/${candidate.id}`)}
      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{candidate.name}</h3>
          <p className="text-sm text-slate-500 truncate mt-0.5">{candidate.email}</p>
          {client && (
            <p className="text-xs text-indigo-600 font-medium mt-1">
              → {client.company}
            </p>
          )}
          {!assignment && (
            <p className="text-xs text-slate-400 mt-1">Not yet assigned</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
            {candidate.internal_score.toFixed(1)}
          </span>
          {assignment && !assignment.feedback && <StatusBadge status={assignment.status} />}
          {assignment?.feedback && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${assignment.feedback.result === 'pass'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
              {assignment.feedback.result === 'pass' ? 'Passed' : 'Failed'}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3 line-clamp-2">{candidate.background}</p>
    </div>
  )
}
