import api from './api'
import type { Client, ClientDetail } from '../types'

export const getClients = async (): Promise<Client[]> => {
  const res = await api.get('/clients')
  return res.data
}

export const getClient = async (id: number): Promise<ClientDetail> => {
  const res = await api.get(`/clients/${id}`)
  return res.data
}

export const createClient = async (
  data: Omit<Client, 'id' | 'created_at'>
): Promise<Client> => {
  const res = await api.post('/clients', data)
  return res.data
}

export const updateClient = async (
  id: number,
  data: Partial<Omit<Client, 'id' | 'created_at'>>
): Promise<Client> => {
  const res = await api.put(`/clients/${id}`, data)
  return res.data
}

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`)
}
