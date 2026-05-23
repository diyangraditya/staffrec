import api from './api'
import type { Assignment, AssignmentDetail } from '../types'

export const createAssignment = async (data: {
  candidate_id: number
  client_id: number
  interview_date?: string
}): Promise<Assignment> => {
  const res = await api.post('/assignments', data)
  return res.data
}

export const getAssignment = async (id: number): Promise<AssignmentDetail> => {
  const res = await api.get(`/assignments/${id}`)
  return res.data
}
