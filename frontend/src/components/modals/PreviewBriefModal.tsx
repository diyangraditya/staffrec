import { type Brief, type CandidateDetail, type Client } from '../../types'
import MarkdownContent from '../ui/MarkdownContent'
import Button from '../ui/Button'

interface PreviewBriefModalProps {
  onClose: () => void
  candidate: CandidateDetail
  client: Client
  brief: Brief
}

export default function PreviewBriefModal({
  onClose,
  candidate,
  client,
  brief,
}: PreviewBriefModalProps) {
  const assignment = candidate.assignment

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">
              Candidate Preview Mode
            </span>
            <h2 className="text-white font-semibold">
              Interview Brief: {client.company}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content (Mimics BriefView) */}
        <div className="overflow-y-auto p-6 sm:p-8 bg-slate-50 flex-1">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Candidate Welcome Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Hi, {candidate.name.split(' ')[0]} 👋
              </h1>
              <p className="text-slate-600">
                You're interviewing with <strong className="text-slate-900">{client.company}</strong>. 
                We've prepared this personalized AI brief to help you succeed.
              </p>
              
              {assignment?.interview_date && (
                <div className="mt-6 flex items-center gap-3 bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg border border-indigo-100">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    Interview Date: {new Date(assignment.interview_date).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* AI Brief Output */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600">
                  ✨
                </span>
                <h2 className="font-semibold text-slate-900">Your AI Prep Brief</h2>
              </div>
              <div className="prose prose-slate prose-indigo max-w-none text-sm sm:text-base">
                <MarkdownContent content={brief.content} />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 shrink-0 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  )
}
