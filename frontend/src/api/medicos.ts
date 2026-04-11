import api from './axios';
import type { Medico, MedicoListItem, Especialidade, MedicoEspecialidade } from '../types';

export const getMedicos = (search?: string, status?: string[]) => {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (status && status.length > 0) params.status = status.join(',');
  return api.get<MedicoListItem[]>('/medicos/', { params }).then((r) => r.data);
};

export const getMedico = (id: number) =>
  api.get<Medico>(`/medicos/${id}/`).then((r) => r.data);

export const getMeuCadastro = () =>
  api.get<Medico>('/medicos/me/').then((r) => r.data);

export const createMedico = (data: FormData) =>
  api.post<Medico>('/medicos/', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const updateMedico = (id: number, data: FormData) =>
  api.patch<Medico>(`/medicos/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const deleteMedico = (id: number) =>
  api.delete(`/medicos/${id}/`);

export const getEspecialidades = () =>
  api.get<Especialidade[]>('/medicos/especialidades/').then((r) => r.data);

export const addComprovante = (medicoId: number, data: FormData) =>
  api.post<MedicoEspecialidade>(`/medicos/${medicoId}/comprovantes/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const deleteComprovante = (medicoId: number, comprovanteId: number) =>
  api.delete(`/medicos/${medicoId}/comprovantes/${comprovanteId}/`);
