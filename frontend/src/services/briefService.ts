import api from './api'
import type { Brief } from '../types'

export const generateBrief = async (assignmentId: number): Promise<Brief> => {
  const res = await api.post('/briefs/generate', { assignment_id: assignmentId })
  return res.data
}

export const getBrief = async (assignmentId: number): Promise<Brief> => {
  const res = await api.get(`/briefs/${assignmentId}`)
  return res.data
}

export const deleteBrief = async (assignmentId: number): Promise<void> => {
  await api.delete(`/briefs/${assignmentId}`)
}
