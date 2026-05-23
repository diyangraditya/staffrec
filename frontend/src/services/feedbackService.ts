import api from './api'
import type { Feedback } from '../types'

export const submitFeedback = async (data: {
  assignment_id: number
  result: string
  feedback_notes: string
  client_remarks: string
}): Promise<Feedback> => {
  const res = await api.post('/feedback', data)
  return res.data
}

export const getFeedback = async (assignmentId: number): Promise<Feedback> => {
  const res = await api.get(`/feedback/${assignmentId}`)
  return res.data
}
