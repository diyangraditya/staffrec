import api from './api'
import type { Assignment, AssignmentDetail } from '../types'

export const createAssignment = async (
  data: Omit<Assignment, 'id' | 'status' | 'created_at'>
): Promise<Assignment> => {
  const res = await api.post('/assignments', data)
  return res.data
}

export const getAssignment = async (id: number): Promise<AssignmentDetail> => {
  const res = await api.get(`/assignments/${id}`)
  return res.data
}

export const updateAssignmentStatus = async (
  id: number,
  status: string
): Promise<Assignment> => {
  const res = await api.patch(`/assignments/${id}/status`, { status })
  return res.data
}

export const updateAssignmentDate = async (
  id: number,
  interview_date: string | null
): Promise<Assignment> => {
  const res = await api.patch(`/assignments/${id}/date`, { interview_date })
  return res.data
}

export const deleteAssignment = async (id: number): Promise<void> => {
  await api.delete(`/assignments/${id}`)
}
