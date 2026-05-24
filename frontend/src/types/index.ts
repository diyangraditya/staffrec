export interface Client {
  id: number
  name: string
  company: string
  interview_style: string
  expectations: string[]
  created_at: string
}

export interface Feedback {
  id: number
  assignment_id: number
  result: 'pass' | 'fail'
  feedback_notes: string
  client_remarks: string
  created_at: string
}

export interface ClientDetail extends Client {
  feedback_history: Feedback[]
}

export interface Candidate {
  id: number
  name: string
  email: string
  background: string
  internal_score: number
  internal_notes: string
  created_at: string
}

export interface Assignment {
  id: number
  candidate_id: number
  client_id: number
  interview_date: string | null
  status: 'pending' | 'briefed' | 'interviewed'
  created_at: string
  feedback?: Feedback | null
}

export interface AssignmentDetail extends Assignment {
  candidate: Candidate
  client: Client
}

export interface CandidateDetail extends Candidate {
  assignment: Assignment | null
}

export interface Brief {
  id: number
  assignment_id: number
  content: string
  generated_at: string
}

export interface User {
  role: 'recruiter' | 'candidate'
  name?: string
  id: number
  email: string
}
