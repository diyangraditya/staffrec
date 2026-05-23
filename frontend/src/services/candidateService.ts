import api from './api'
import type { Candidate, CandidateDetail } from '../types'

export const getCandidates = async (): Promise<CandidateDetail[]> => {
  const res = await api.get('/candidates')
  return res.data
}

export const getCandidate = async (id: number): Promise<CandidateDetail> => {
  const res = await api.get(`/candidates/${id}`)
  return res.data
}

export const createCandidate = async (
  data: Omit<Candidate, 'id' | 'created_at'>
): Promise<Candidate> => {
  const res = await api.post('/candidates', data)
  return res.data
}

export const updateCandidate = async (
  id: number,
  data: Partial<Omit<Candidate, 'id' | 'created_at'>>
): Promise<Candidate> => {
  const res = await api.put(`/candidates/${id}`, data)
  return res.data
}

export const deleteCandidate = async (id: number): Promise<void> => {
  await api.delete(`/candidates/${id}`)
}
