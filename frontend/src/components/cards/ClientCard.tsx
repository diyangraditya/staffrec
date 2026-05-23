import { useNavigate } from 'react-router-dom'
import type { Client } from '../../types'

interface ClientCardProps {
  client: Client
}

const styleConfig: Record<string, { label: string; className: string }> = {
  consulting: { label: 'Consulting', className: 'bg-purple-100 text-purple-700' },
  startup: { label: 'Startup', className: 'bg-orange-100 text-orange-700' },
}

export default function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate()
  const style = styleConfig[client.interview_style] ?? {
    label: client.interview_style,
    className: 'bg-slate-100 text-slate-600',
  }

  return (
    <div
      onClick={() => navigate(`/recruiter/clients/${client.id}`)}
      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{client.company}</h3>
          <p className="text-sm text-slate-500 mt-0.5">Contact: {client.name}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.className}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {client.expectations.slice(0, 3).map((exp) => (
          <span
            key={exp}
            className="bg-slate-50 text-slate-500 text-xs px-2 py-0.5 rounded-md border border-slate-100"
          >
            {exp}
          </span>
        ))}
        {client.expectations.length > 3 && (
          <span className="text-xs text-slate-400 self-center">
            +{client.expectations.length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}
